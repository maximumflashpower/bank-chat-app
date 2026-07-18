import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CD = 'cd',
  MONEY_MARKET = 'money_market',
}

export enum AccountStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  DORMANT = 'dormant',
  CLOSED = 'closed',
  RESTRICTED = 'restricted',
}

export enum KycStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

@Entity('retail_account')
export class RetailAccount extends BaseEntity {
  @Column({ name: 'account_number', type: 'varchar', length: 50, unique: true, nullable: false })
  accountNumber: string;

  @Column({ name: 'iban_number', type: 'varchar', length: 50, nullable: true })
  ibanNumber: string | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: false })
  customerId: string;

  @Column({ name: 'account_type', type: 'varchar', length: 20, nullable: false })
  accountType: AccountType;

  @Column({ name: 'account_subtype', type: 'varchar', length: 30, nullable: true })
  accountSubtype: string | null;

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

  @Column({ name: 'overdraft_limit', type: 'numeric', precision: 18, scale: 2, default: 0 })
  overdraftLimit: number;

  @Column({ name: 'overdraft_protection_enabled', type: 'boolean', default: false })
  overdraftProtectionEnabled: boolean;

  @Column({ name: 'interest_rate', type: 'numeric', precision: 8, scale: 5, default: 0 })
  interestRate: number;

  @Column({ name: 'interest_calculation_method', type: 'varchar', length: 20, nullable: true })
  interestCalculationMethod: string | null;

  @Column({ name: 'interest_last_accrued', type: 'date', nullable: true })
  interestLastAccrued: Date | null;

  @Column({ name: 'monthly_fee', type: 'numeric', precision: 18, scale: 2, nullable: true })
  monthlyFee: number | null;

  @Column({ name: 'fee_waiver_conditions', type: 'jsonb', nullable: true })
  feeWaiverConditions: Record<string, unknown> | null;

  @Column({ name: 'opened_at', type: 'timestamptz', nullable: true })
  openedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'close_reason', type: 'varchar', length: 100, nullable: true })
  closeReason: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: AccountStatus;

  @Column({ name: 'dormancy_flag', type: 'boolean', default: false })
  dormancyFlag: boolean;

  @Column({ name: 'last_activity_at', type: 'timestamptz', nullable: true })
  lastActivityAt: Date | null;

  @Column({ name: 'kyc_verification_status', type: 'varchar', length: 20, nullable: false })
  kycVerificationStatus: KycStatus;

  @Column({ name: 'kyc_verified_at', type: 'timestamptz', nullable: true })
  kycVerifiedAt: Date | null;

  @Column({ name: 'digital_signature_ref', type: 'text', nullable: true })
  digitalSignatureRef: string | null;
}
