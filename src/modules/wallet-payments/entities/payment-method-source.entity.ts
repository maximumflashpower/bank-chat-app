import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum PaymentType {
  BANK_ACCOUNT = 'bank_account',
  CARD = 'card',
  EXTERNAL_WALLET = 'external_wallet',
  CRYPTO_WALLET = 'crypto_wallet',
}

export enum VerificationStatus {
  VERIFIED = 'verified',
  PENDING = 'pending_unverified',
}

@Entity('payment_method_source')
@Index(['customerId'])
export class PaymentMethodSource extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 30, name: 'payment_type' })
  paymentType: PaymentType;

  @Column({ type: 'varchar', length: 30, nullable: true, name: 'payment_subtype' })
  paymentSubtype?: string;

  @Column({ type: 'uuid', nullable: true, name: 'source_bank_account_id' })
  sourceBankAccountId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'source_card_id' })
  sourceCardId?: string;

  @Column({ type: 'text', nullable: true, name: 'source_external_wallet_ref' })
  sourceExternalWalletRef?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'label_name_display' })
  labelNameDisplay?: string;

  @Column({ type: 'varchar', length: 3, default: 'USD', name: 'currency_supported' })
  currencySupported: string;

  @Column({ type: 'boolean', default: false, name: 'is_primary_default' })
  isPrimaryDefault: boolean;

  @Column({ type: 'varchar', length: 20, name: 'verification_status' })
  verificationStatus: VerificationStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'micropayment_verified_at' })
  micropaymentVerifiedAt?: Date;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'daily_spend_limit' })
  dailySpendLimit?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'weekly_spend_limit' })
  weeklySpendLimit?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'monthly_spend_limit' })
  monthlySpendLimit?: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt?: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;
}
