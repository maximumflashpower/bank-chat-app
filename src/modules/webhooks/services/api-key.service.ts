import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey, ApiKeyStatus, ApiKeyTier } from '../entities/api-key.entity';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private keyRepo: Repository<ApiKey>,
  ) {}

  async generateApiKey(
    tenantId: string,
    name: string,
    scopes: string[],
    tier: ApiKeyTier = ApiKeyTier.FREE,
    rateLimitPerMin = 60,
    monthlyQuota = 10000,
  ): Promise<{ apiKey: ApiKey; plainKey: string }> {
    const rawKey = `bk_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 8);

    const apiKey = this.keyRepo.create({
      tenantId,
      name,
      scopes,
      tier,
      keyHash,
      keyPrefix,
      rateLimitPerMin,
      monthlyQuota,
    });

    const saved = await this.keyRepo.save(apiKey);
    return { apiKey: saved, plainKey: rawKey };
  }

  async listApiKeys(tenantId: string): Promise<ApiKey[]> {
    return this.keyRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeApiKey(keyId: string, tenantId: string): Promise<void> {
    const key = await this.keyRepo.findOne({ where: { id: keyId, tenantId } });
    if (!key) {
      throw new NotFoundException('API key not found');
    }

    key.status = ApiKeyStatus.REVOKED;
    key.revokedAt = new Date();
    await this.keyRepo.save(key);
  }

  async validateApiKey(rawKey: string): Promise<ApiKey | null> {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.keyRepo.findOne({ where: { keyHash } });

    if (!apiKey || apiKey.status !== ApiKeyStatus.ACTIVE) {
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      apiKey.status = ApiKeyStatus.EXPIRED;
      await this.keyRepo.save(apiKey);
      return null;
    }

    apiKey.lastUsedAt = new Date();
    apiKey.usageThisMonth += 1;
    await this.keyRepo.save(apiKey);

    return apiKey;
  }

  async checkQuota(apiKey: ApiKey): Promise<boolean> {
    return apiKey.usageThisMonth < apiKey.monthlyQuota;
  }
}
