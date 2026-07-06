import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasskeySyncMetadata } from '../entities/passkey-sync-metadata.entity';

@Injectable()
export class PasskeySyncService {
  constructor(
    @InjectRepository(PasskeySyncMetadata)
    private readonly repo: Repository<PasskeySyncMetadata>,
  ) {}

  async syncPasskey(userId: string, passkeyId: string, deviceId: string, isPrimary?: boolean): Promise<PasskeySyncMetadata> {
    const metadata = this.repo.create({
      userId,
      passkeyId,
      deviceId,
      isPrimary: isPrimary ?? false,
      syncedAt: new Date(),
    });
    return this.repo.save(metadata);
  }

  async listUserPasskeys(userId: string): Promise<PasskeySyncMetadata[]> {
    return this.repo.find({ where: { userId }, order: { syncedAt: 'DESC' } });
  }

  async revokePasskeyOnDevice(userId: string, passkeyId: string, deviceId: string): Promise<void> {
    await this.repo.delete({ userId, passkeyId, deviceId });
  }

  async getLastUsedRemote(userId: string, passkeyId: string): Promise<Date | null> {
    const record = await this.repo.findOne({ where: { userId, passkeyId } });
    return record?.lastUsedRemote ?? null;
  }
}
