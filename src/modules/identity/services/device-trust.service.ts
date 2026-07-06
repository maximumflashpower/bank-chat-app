import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { DeviceTrust } from '../entities/device-trust.entity';
import { DeviceTrustLevel } from '../entities/device-trust-level.enum';
import { DeviceTrustLabelDto, TrustAction } from '../dto/device-trust-label.dto';

@Injectable()
export class DeviceTrustService {
  constructor(
    @InjectRepository(DeviceTrust)
    private readonly repo: Repository<DeviceTrust>,
  ) {}

  async trackDevice(userId: string, deviceId: string, deviceFingerprint?: string): Promise<DeviceTrust> {
    let record = await this.repo.findOne({ where: { userId, deviceId } });
    
    if (record) {
      record.lastActivity = new Date();
      return this.repo.save(record);
    }

    record = this.repo.create({
      userId,
      deviceId,
      trustLevel: DeviceTrustLevel.TRUSTED,
      reputationScore: 100,
      firstSeen: new Date(),
      lastActivity: new Date(),
      deviceFingerprint: deviceFingerprint ?? null,
      deviceTypeLabel: null,
      revokedAt: null,
      revocationReason: null,
    });
    return this.repo.save(record);
  }

  async updateTrustLabel(userId: string, deviceId: string, dto: DeviceTrustLabelDto): Promise<DeviceTrust> {
    const record = await this.repo.findOneOrFail({ where: { userId, deviceId } });

    switch (dto.action) {
      case TrustAction.MARK_TRUSTED:
        record.trustLevel = DeviceTrustLevel.TRUSTED;
        break;
      case TrustAction.MARK_UNTRUSTED:
        record.trustLevel = DeviceTrustLevel.UNTRUSTED;
        break;
      case TrustAction.REVOKE:
        record.trustLevel = DeviceTrustLevel.REVOKED;
        record.revokedAt = new Date();
        record.revocationReason = dto.reason ?? null;
        break;
    }

    if (dto.deviceTypeLabel) {
      record.deviceTypeLabel = dto.deviceTypeLabel;
    }

    return this.repo.save(record);
  }

  async revokeAllUserDevicesExceptOne(userId: string, keepDeviceId: string): Promise<number> {
    const affected = await this.repo.update(
      { userId, deviceId: Not(keepDeviceId) },
      {
        trustLevel: DeviceTrustLevel.REVOKED,
        revokedAt: new Date(),
      }
    );
    return Number(affected.affected);
  }

  async getUserDevices(userId: string): Promise<DeviceTrust[]> {
    return this.repo.find({ where: { userId }, order: { lastActivity: 'DESC' } });
  }

  async calculateReputationScore(deviceId: string, events: number[]): Promise<number> {
    // Placeholder: ML-based reputation calculation
    return Math.max(0, 100 - events.length * 5);
  }
}
