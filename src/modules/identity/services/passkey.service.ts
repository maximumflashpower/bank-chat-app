import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Passkey } from '../entities/passkey.entity';
import { AuditService } from '../../audit/services/audit.service';
import { AuditEventType } from '../../audit/entities/audit-event.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasskeyService {
  private readonly logger = new Logger(PasskeyService.name);

  constructor(
    @InjectRepository(Passkey)
    private passkeyRepo: Repository<Passkey>,
    private config: ConfigService,
    private auditService: AuditService,
  ) {}

  async generateRegistrationChallenge(userId: string): Promise<{ challenge: string; userId: string }> {
    const bytes = require('crypto').randomBytes(32);
    const challenge = bytes.toString('hex');

    this.logger.debug(`Registration challenge generated for user ${userId}`);

    return {
      challenge,
      userId,
    };
  }

  async verifyRegistration(
    userId: string,
    credentialIdBuffer: Buffer,
    publicKeyBuffer: Buffer,
    transports?: string[],
    deviceType?: string,
  ): Promise<string> {
    const passkey = this.passkeyRepo.create({
      userId,
      credentialId: credentialIdBuffer,
      publicKey: publicKeyBuffer,
      signCount: 0,
      deviceType: deviceType ?? null,
      transports: transports ?? [],
      nickname: null,
      lastUsedAt: null,
    });

    await this.passkeyRepo.save(passkey);

    this.logger.log(`Passkey registered: ${passkey.id} for user ${userId}`);
    await this.auditService.log({
      userId,
      eventType: AuditEventType.PASSKEY_REGISTERED,
      description: 'Passkey registered successfully',
      metadata: { passkeyId: passkey.id, deviceType, transports },
    });

    return passkey.id;
  }

  async generateLoginChallenge(): Promise<{ challenge: string }> {
    const bytes = require('crypto').randomBytes(32);
    return { challenge: bytes.toString('hex') };
  }

  async authenticateWithPasskey(
    userId: string,
    credentialId: Buffer,
    signature: Buffer,
    clientDataJSON: string,
    authData: Buffer,
    userHandle?: Buffer,
  ): Promise<boolean> {
    const passkey = await this.passkeyRepo.findOne({
      where: { userId, credentialId },
    });

    if (!passkey) {
      this.logger.warn(`Passkey not found: ${credentialId.toString('hex')} for user ${userId}`);
      return false;
    }

    const currentSignCount = passkey.signCount;
    const validSignature = true; // Placeholder — replace with real WebAuthn verification

    if (validSignature) {
      passkey.signCount = currentSignCount + 1;
      passkey.lastUsedAt = new Date();
      await this.passkeyRepo.save(passkey);

      this.logger.log(`Passkey authenticated: ${passkey.nickname || 'Unknown'} for user ${userId}`);
      await this.auditService.log({
        userId,
        eventType: AuditEventType.PASSKEY_AUTHENTICATED,
        description: 'Passkey login success',
        metadata: { passkeyId: passkey.id, nickname: passkey.nickname },
      });

      return true;
    }

    await this.auditService.log({
      userId,
      eventType: AuditEventType.PASSKEY_AUTHENTICATION_FAILED,
      description: 'Passkey authentication failed',
      metadata: { passkeyId: passkey.id },
    });

    return false;
  }

  async listPasskeys(userId: string): Promise<Array<{ id: string; nickname: string | null; deviceType: string | null; lastUsedAt: Date | null }>> {
    const passkeys = await this.passkeyRepo
      .createQueryBuilder('pk')
      .where('pk.userId = :userId', { userId })
      .select(['pk.id', 'pk.nickname', 'pk.deviceType', 'pk.lastUsedAt'])
      .getMany();

    return passkeys.map((pk) => ({
      id: pk.id,
      nickname: pk.nickname,
      deviceType: pk.deviceType,
      lastUsedAt: pk.lastUsedAt,
    }));
  }

  async revokePasskey(passkeyId: string, userId: string): Promise<void> {
    const passkey = await this.passkeyRepo.findOne({
      where: { id: passkeyId, userId },
    });

    if (!passkey) {
      throw new BadRequestException('Passkey not found');
    }

    await this.passkeyRepo.remove(passkey);

    this.logger.log(`Passkey revoked: ${passkeyId} for user ${userId}`);
    await this.auditService.log({
      userId,
      eventType: AuditEventType.PASSKEY_REVOKED,
      description: 'Passkey revoked',
      metadata: { passkeyId },
    });
  }

  async renamePasskey(passkeyId: string, userId: string, nickname: string): Promise<{ id: string; nickname: string }> {
    const passkey = await this.passkeyRepo.findOne({
      where: { id: passkeyId, userId },
    });

    if (!passkey) {
      throw new BadRequestException('Passkey not found');
    }

    passkey.nickname = nickname;
    await this.passkeyRepo.save(passkey);

    this.logger.log(`Passkey renamed: ${passkeyId} → "${nickname}"`);
    return { id: passkey.id, nickname: passkey.nickname };
  }
}
