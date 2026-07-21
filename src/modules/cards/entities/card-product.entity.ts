import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum CardType {
  DEBIT = 'debit',
  CREDIT = 'credit',
  PREPAID = 'prepaid',
  CHARGE = 'charge',
}

export enum CardNetwork {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DISCOVER = 'discover',
}

export enum CardLevel {
  CLASSIC = 'classic',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  SIGNATURE = 'signature',
  INFINITE = 'infinite',
}

@Entity('card_product')
export class CardProduct extends BaseEntity {
  @Column({ name: 'product_code', type: 'varchar', length: 50, unique: true, nullable: false })
  productCode: string;

  @Column({ name: 'product_name', type: 'varchar', length: 255, nullable: false })
  productName: string;

  @Column({ name: 'card_type', type: 'varchar', length: 20, nullable: false })
  cardType: CardType;

  @Column({ name: 'card_network', type: 'varchar', length: 20, nullable: false })
  cardNetwork: CardNetwork;

  @Column({ name: 'card_level', type: 'varchar', length: 20, nullable: false })
  cardLevel: CardLevel;

  @Column({ name: 'bin_range_start', type: 'varchar', length: 6, nullable: false })
  binRangeStart: string;

  @Column({ name: 'bin_range_end', type: 'varchar', length: 6, nullable: false })
  binRangeEnd: string;

  @Column({ name: 'pan_length', type: 'int', default: 16 })
  panLength: number;

  @Column({ name: 'cvv_length', type: 'int', default: 3 })
  cvvLength: number;

  @Column({ name: 'default_credit_limit', type: 'numeric', precision: 18, scale: 2, nullable: true })
  defaultCreditLimit: number | null;

  @Column({ name: 'default_daily_purchase_limit', type: 'numeric', precision: 18, scale: 2, default: 5000 })
  defaultDailyPurchaseLimit: number;

  @Column({ name: 'default_daily_atm_limit', type: 'numeric', precision: 18, scale: 2, default: 1000 })
  defaultDailyAtmLimit: number;

  @Column({ name: 'default_online_limit', type: 'numeric', precision: 18, scale: 2, default: 3000 })
  defaultOnlineLimit: number;

  @Column({ name: 'interest_rate_purchase', type: 'numeric', precision: 8, scale: 5, nullable: true })
  interestRatePurchase: number | null;

  @Column({ name: 'interest_rate_cash_advance', type: 'numeric', precision: 8, scale: 5, nullable: true })
  interestRateCashAdvance: number | null;

  @Column({ name: 'grace_period_days', type: 'int', default: 25 })
  gracePeriodDays: number;

  @Column({ name: 'annual_fee', type: 'numeric', precision: 18, scale: 2, default: 0 })
  annualFee: number;

  @Column({ name: 'foreign_transaction_fee_pct', type: 'numeric', precision: 5, scale: 2, default: 0 })
  foreignTransactionFeePct: number;

  @Column({ name: 'late_payment_fee', type: 'numeric', precision: 18, scale: 2, nullable: true })
  latePaymentFee: number | null;

  @Column({ name: 'over_limit_fee', type: 'numeric', precision: 18, scale: 2, nullable: true })
  overLimitFee: number | null;

  @Column({ name: 'cash_advance_fee_pct', type: 'numeric', precision: 5, scale: 2, nullable: true })
  cashAdvanceFeePct: number | null;

  @Column({ name: 'rewards_program_id', type: 'uuid', nullable: true })
  rewardsProgramId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
