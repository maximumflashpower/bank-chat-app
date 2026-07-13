import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum ApiKeyTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum ApiKeyStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

@Entity('api_key')
export class ApiKey extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'key_hash', length: 128, unique: true })
  keyHash: string;

  @Column({ name: 'key_prefix', length: 8 })
  keyPrefix: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', array: true, default: [] })
  scopes: string[];

  @Column({ name: 'tier', type: 'enum', enum: ApiKeyTier, default: ApiKeyTier.FREE })
  tier: ApiKeyTier;

  @Column({ name: 'rate_limit_per_min', type: 'int', default: 60 })
  rateLimitPerMin: number;

  @Column({ name: 'monthly_quota', type: 'bigint', default: 10000 })
  monthlyQuota: number;

  @Column({ name: 'usage_this_month', type: 'bigint', default: 0 })
  usageThisMonth: number;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @Column({ type: 'enum', enum: ApiKeyStatus, default: ApiKeyStatus.ACTIVE })
  status: ApiKeyStatus;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;
}
