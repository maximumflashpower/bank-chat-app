import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum PolicyStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  LAPSED = 'lapsed',
}

export enum RenewalType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  NONE = 'none',
}

export enum PremiumFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
}

@Entity('insurance_policies')
export class InsurancePolicy extends BaseEntity {
  @Column({ name: 'policy_number', type: 'varchar', length: 50, nullable: false })
  policyNumber: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ name: 'product_id', type: 'integer', nullable: false })
  productId: number;

  @Column({ name: 'quote_id', type: 'uuid', nullable: true })
  quoteId: string | null;

  @Column({ name: 'coverage_level', type: 'varchar', length: 30, nullable: false })
  coverageLevel: string;

  @Column({ name: 'premium_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  premiumAmount: number;

  @Column({ name: 'premium_frequency', type: 'varchar', length: 20, default: PremiumFrequency.MONTHLY })
  premiumFrequency: PremiumFrequency;

  @Column({ name: 'currency', type: 'varchar', length: 3, nullable: false })
  currency: string;

  @Column({ name: 'deductible', type: 'numeric', precision: 18, scale: 2, nullable: true })
  deductible: number | null;

  @Column({ name: 'coverage_limits', type: 'jsonb', nullable: false })
  coverageLimits: Record<string, any>;

  @Column({ name: 'start_date', type: 'date', nullable: false })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: false })
  endDate: Date;

  @Column({ name: 'renewal_type', type: 'varchar', length: 20, default: RenewalType.AUTOMATIC })
  renewalType: RenewalType;

  @Column({ type: 'varchar', length: 20, default: PolicyStatus.ACTIVE })
  status: PolicyStatus;

  @Column({ name: 'agent_id', type: 'uuid', nullable: true })
  agentId: string | null;

  @Column({ name: 'underwriter_id', type: 'uuid', nullable: true })
  underwriterId: string | null;

  @Column({ name: 'ledger_account_id', type: 'uuid', nullable: true })
  ledgerAccountId: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'metadata', type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;
}
