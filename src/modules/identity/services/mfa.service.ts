import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { MfaFactor } from '../entities/mfa-factor.entity';
import { MfaType } from '../entities/mfa-type.enum';
import { AuditService } from '../../audit/services/audit.service';
import { AuditEventType } from '../../audit/entities/audit-event.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || 'fallback-key-change-in-prod';

  constructor(
    @InjectRepository(MfaFactor)
    private mfaRepo: Repository<MfaFactor>,
    private config: ConfigService,
    private auditService: AuditService,
  ) {}

  async generateTOTPSecret(): Promise<{ secret: string; qrCodeData: string }> {
    const bytes = crypto.randomBytes(10);
    const secret = bytes.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encryptedSecret = this.encrypt(secret);

    return {
      secret: encryptedSecret,
      qrCodeData: `otpauth://totp/BankChat:user?secret=${encodeURIComponent(encryptedSecret)}&issuer=BankChat`,
    };
  }

  async setupMfaFactor(userId: string, type: MfaType, encryptedSecret?: string): Promise<string> {
    const factor = this.mfaRepo.create({
      userId,
      type,
      secretEncrypted: encryptedSecret ?? null,
      isActive: false,
      verifiedAt: null,
      backupCodesHashed: null,
      label: null,
    });

    await this.mfaRepo.save(factor);

    this.logger.log(`MFA factor created: ${factor.id} — type: ${type} for user ${userId}`);
    await this.auditService.log({
      userId,
      eventType: AuditEventType.MFA_SETUP_STARTED,
      description: `MFA setup initiated: ${type}`,
      metadata: { factorId: factor.id, type },
    });

    return factor.id;
  }

  async verifyTOTPCode(mfaFactorId: string, code: string): Promise<boolean> {
    const factor = await this.mfaRepo.findOne({
      where: { id: mfaFactorId, type: MfaType.TOTP },
    });

    if (!factor || !factor.secretEncrypted || !factor.isActive) {
      return false;
    }

    const decryptedSecret = this.decrypt(factor.secretEncrypted);
    const isValid = this.verifyCode(decryptedSecret, code);

    if (isValid) {
      factor.verifiedAt = new Date();
      await this.mfaRepo.save(factor);

      await this.auditService.log({
        userId: factor.userId,
        eventType: AuditEventType.MFA_VERIFIED,
        description: 'TOTP verification successful',
        metadata: { factorId: mfaFactorId },
      });
    } else {
      await this.auditService.log({
        userId: factor.userId,
        eventType: AuditEventType.MFA_FAILED,
        description: 'TOTP verification failed',
        metadata: { factorId: mfaFactorId },
      });
    }

    return isValid;
  }

  async enableFactor(factorId: string, code: string): Promise<boolean> {
    const factor = await this.mfaRepo.findOneBy({ id: factorId });
    if (!factor) {
      throw new BadRequestException('MFA factor not found');
    }

    if (factor.type === MfaType.TOTP) {
      const decryptedSecret = this.decrypt(factor.secretEncrypted!);
      const isValid = this.verifyCode(decryptedSecret, code);
      if (!isValid) {
        return false;
      }
    }

    factor.isActive = true;
    factor.verifiedAt = new Date();
    await this.mfaRepo.save(factor);

    this.logger.log(`MFA factor enabled: ${factorId}`);
    await this.auditService.log({
      userId: factor.userId,
      eventType: AuditEventType.MFA_VERIFIED,
      description: `MFA factor enabled: ${factor.type}`,
      metadata: { factorId },
    });

    return true;
  }

  async disableFactor(factorId: string, userId: string): Promise<void> {
    const factor = await this.mfaRepo.findOne({
      where: { id: factorId, userId },
    });

    if (!factor) {
      throw new BadRequestException('MFA factor not found');
    }

    factor.isActive = false;
    await this.mfaRepo.save(factor);

    this.logger.log(`MFA factor disabled: ${factorId}`);
    await this.auditService.log({
      userId,
      eventType: AuditEventType.MFA_DISABLED,
      description: `MFA disabled: ${factor.type}`,
      metadata: { factorId },
    });
  }

  async listFactors(userId: string): Promise<Partial<MfaFactor>[]> {
    const factors = await this.mfaRepo.find({
      where: { userId },
    });

    return factors.map((f) => ({
      id: f.id,
      type: f.type,
      isActive: f.isActive,
      label: f.label,
      verifiedAt: f.verifiedAt,
    }));
  }

  async generateBackupCodes(userId: string, count: number = 8): Promise<string[]> {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const bytes = crypto.randomBytes(5);
      codes.push(bytes.toString('hex').toUpperCase());
    }

    const hashedCodes = await Promise.all(codes.map(async (code) => bcrypt.hash(code, 10)));

    const factor = await this.mfaRepo.findOne({
      where: { userId, type: MfaType.BACKUP_CODE },
    });

    if (factor) {
      factor.backupCodesHashed = hashedCodes;
      await this.mfaRepo.save(factor);
    } else {
      const newFactor = this.mfaRepo.create({
        userId,
        type: MfaType.BACKUP_CODE,
        secretEncrypted: null,
        isActive: true,
        verifiedAt: new Date(),
        backupCodesHashed: hashedCodes,
        label: 'Backup Codes',
      });
      await this.mfaRepo.save(newFactor);
    }

    this.logger.log(`Generated ${count} backup codes for user ${userId}`);
    return codes;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const factor = await this.mfaRepo.findOne({
      where: { userId, type: MfaType.BACKUP_CODE },
    });

    if (!factor || !Array.isArray(factor.backupCodesHashed)) {
      return false;
    }

    let usedIndex = -1;
    for (let i = 0; i < factor.backupCodesHashed.length; i++) {
      const match = await bcrypt.compare(code, factor.backupCodesHashed[i]);
      if (match) {
        usedIndex = i;
        break;
      }
    }

    if (usedIndex >= 0) {
      factor.backupCodesHashed.splice(usedIndex, 1);
      await this.mfaRepo.save(factor);

      this.logger.log(`Used backup code for user ${userId}, ${factor.backupCodesHashed.length} remaining`);
      await this.auditService.log({
        userId,
        eventType: AuditEventType.MFA_USED_BACKUP_CODE,
        description: 'Backup code used',
        metadata: { remaining: factor.backupCodesHashed.length },
      });

      return true;
    }

    return false;
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(this.ENCRYPTION_KEY.padEnd(32, 'x'));
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(encrypted: string): string {
    const [ivHex, data] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(this.ENCRYPTION_KEY.padEnd(32, 'x'));
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private verifyCode(secret: string, code: string): boolean {
    const { authenticator } = require('otplib');
    authenticator.options = { window: 1 };
    return authenticator.checkToken(code, secret);
  }
}
