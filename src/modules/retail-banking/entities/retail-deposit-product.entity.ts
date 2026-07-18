import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum DepositProductType {
  CD = 'cd',
  MONEY_MARKET = 'money_market',
  TIME_DEPOSIT = 'time_deposit',
}

export enum InterestPayoutFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  AT_MATURITY = 'at_maturity',
}

export enum InterestCompoundFrequency {
  SIMPLE = 'simple',
  COMPOUND_DAILY = 'compound_daily',
  COMPOUND_MONTHLY = 'compound_monthly',
}

export enum EarlyWithdrawalPenaltyType {
  FIXED_AMOUNT = 'fixed_amount',
  MONTHS_INTEREST = 'months_interest',
  PERCENTAGE = 'percentage',
}

export enum DepositProductStatus {
  ACTIVE = 'active',
  MATURED = 'matured',
  WITHDRAWN = 'withdrawn',
  RENEWED = 'renewed',
}

@Entity('retail_deposit_product')
export class RetailDepositProduct extends BaseEntity {
  @Column({ name: 'account_id', type: 'uuid', nullable: false })
  accountId: string;

  @Column({ name: 'product_type', type: 'varchar', length: 20, nullable: false })
  productType: DepositProductType;

  @Column({ name: 'principal_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  principalAmount: number;

  @Column({ name: 'interest_rate', type: 'numeric', precision: 8, scale: 5, nullable: false })
  interestRate: number;

  @Column({ name: 'annual_percentage_yield', type: 'numeric', precision: 8, scale: 5, nullable: true })
  annualPercentageYield: number | null;

  @Column({ name: 'term_months', type: 'integer', nullable: false })
  termMonths: number;

  @Column({ name: 'maturity_date', type: 'date', nullable: false })
  maturityDate: Date;

  @Column({ name: 'interest_payout_frequency', type: 'varchar', length: 20, nullable: false })
  interestPayoutFrequency: InterestPayoutFrequency;

  @Column({ name: 'interest_compound_frequency', type: 'varchar', length: 20, nullable: true })
  interestCompoundFrequency: InterestCompoundFrequency | null;

  @Column({ name: 'interest_payout_account_id', type: 'uuid', nullable: true })
  interestPayoutAccountId: string | null;

  @Column({ name: 'early_withdrawal_penalty_type', type: 'varchar', length: 30, nullable: true })
  earlyWithdrawalPenaltyType: EarlyWithdrawalPenaltyType | null;

  @Column({ name: 'early_withdrawal_penalty_value', type: 'numeric', precision: 18, scale: 2, nullable: true })
  earlyWithdrawalPenaltyValue: number | null;

  @Column({ name: 'grace_period_days', type: 'integer', default: 7 })
  gracePeriodDays: number;

  @Column({ name: 'auto_renew_enabled', type: 'boolean', default: false })
  autoRenewEnabled: boolean;

  @Column({ name: 'auto_renew_term_months', type: 'integer', nullable: true })
  autoRenewTermMonths: number | null;

  @Column({ name: 'renewal_instructions', type: 'text', nullable: true })
  renewalInstructions: string | null;

  @Column({ name: 'maturity_notice_sent_at', type: 'timestamptz', nullable: true })
  maturityNoticeSentAt: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: DepositProductStatus;
}
