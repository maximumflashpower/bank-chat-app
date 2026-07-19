import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum BusinessAccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  MONEY_MARKET = 'money_market',
  CD = 'cd',
}

export enum BusinessAccountTier {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  TREASURY = 'treasury',
}

export enum BusinessAccountStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  DORMANT = 'dormant',
  CLOSED = 'closed',
  RESTRICTED = 'restricted',
}

export enum KycCorporateStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

@Entity('business_account')
export class BusinessAccount extends BaseEntity {
  @Column({ name: 'account_number', type: 'varchar', length: 50, unique: true, nullable: false })
  accountNumber: string;

  @Column({ name: 'iban_number', type: 'varchar', length: 50, nullable: true })
  ibanNumber: string | null;

  @Column({ name: 'organization_id', type: 'uuid', nullable: false })
  organizationId: string;

  @Column({ name: 'account_type', type: 'varchar', length: 20, nullable: false })
  accountType: BusinessAccountType;

  @Column({ name: 'account_tier', type: 'varchar', length: 20, nullable: false })
  accountTier: BusinessAccountTier;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'current_balance', type: 'numeric', precision: 18, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ name: 'available_balance', type: 'numeric', precision: 18, scale: 2, default: 0 })
  availableBalance: number;

  @Column({ name: 'hold_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  holdAmount: number;

  @Column({ name: 'minimum_balance_required', type: 'numeric', precision: 18, scale: 2, nullable: true })
  minimumBalanceRequired: number | null;

  @Column({ name: 'earnings_credit_rate', type: 'numeric', precision: 8, scale: 5, nullable: true })
  earningsCreditRate: number | null;

  @Column({ name: 'monthly_fee', type: 'numeric', precision: 18, scale: 2, nullable: true })
  monthlyFee: number | null;

  @Column({ name: 'fee_waiver_earnings_credit', type: 'boolean', default: true })
  feeWaiverEarningsCredit: boolean;

  @Column({ name: 'wire_transfer_limit_daily', type: 'numeric', precision: 18, scale: 2, nullable: true })
  wireTransferLimitDaily: number | null;

  @Column({ name: 'ach_transfer_limit_daily', type: 'numeric', precision: 18, scale: 2, nullable: true })
  achTransferLimitDaily: number | null;

  @Column({ name: 'overdraft_line_credit', type: 'numeric', precision: 18, scale: 2, default: 0 })
  overdraftLineCredit: number;

  @Column({ name: 'positive_pay_enabled', type: 'boolean', default: true })
  positivePayEnabled: boolean;

  @Column({ name: 'fraud_filter_ach_enabled', type: 'boolean', default: true })
  fraudFilterAchEnabled: boolean;

  @Column({ name: 'kyc_corporate_status', type: 'varchar', length: 20, nullable: false })
  kycCorporateStatus: KycCorporateStatus;

  @Column({ name: 'kyc_verified_at', type: 'timestamptz', nullable: true })
  kycVerifiedAt: Date | null;

  @Column({ name: 'digital_contract_ref', type: 'text', nullable: true })
  digitalContractRef: string | null;

  @Column({ name: 'opened_at', type: 'timestamptz', nullable: true })
  openedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: BusinessAccountStatus;

  @Column({ name: 'last_activity_at', type: 'timestamptz', nullable: true })
  lastActivityAt: Date | null;
}
