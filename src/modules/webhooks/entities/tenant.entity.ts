import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export enum TenantPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

@Entity('tenant')
export class Tenant extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ type: 'enum', enum: TenantPlan, default: TenantPlan.FREE })
  plan: TenantPlan;

  @Column({ name: 'custom_domain', length: 255, nullable: true })
  customDomain: string | null;

  @Column({ name: 'ssl_cert_arn', length: 255, nullable: true })
  sslCertArn: string | null;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, unknown>;

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.ACTIVE })
  status: TenantStatus;

  @Column({ name: 'billing_email', length: 255, nullable: true })
  billingEmail: string | null;

  @Column({ name: 'contact_phone', length: 50, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'region', length: 50, default: 'us-east-1' })
  region: string;

  @Column({ name: 'provisioned_at', type: 'timestamptz', default: () => 'NOW()' })
  provisionedAt: Date;

  @Column({ name: 'suspended_at', type: 'timestamptz', nullable: true })
  suspendedAt: Date | null;

  @Column({ name: 'monthly_requests', type: 'bigint', default: 0 })
  monthlyRequests: number;

  @Column({ name: 'total_requests', type: 'bigint', default: 0 })
  totalRequests: number;
}
