import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum CardStatus {
  ISSUED = 'issued',
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  LOST = 'lost',
  STOLEN = 'stolen',
  EXPIRED = 'expired',
  RENEWED = 'renewed',
  CLOSED = 'closed',
  PENDING_ACTIVATION = 'pending_activation',
}

@Entity('card_instance')
export class CardInstance extends BaseEntity {
  @Column({ name: 'card_product_id', type: 'uuid', nullable: false })
  cardProductId: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: false })
  customerId: string;

  @Column({ name: 'account_id', type: 'uuid', nullable: false })
  accountId: string;

  @Column({ name: 'pan_encrypted', type: 'text', nullable: false })
  panEncrypted: string;

  @Column({ name: 'pan_last_four', type: 'varchar', length: 4, nullable: false })
  panLastFour: string;

  @Column({ name: 'pan_hash', type: 'varchar', length: 128, unique: true, nullable: false })
  panHash: string;

  @Column({ name: 'expiration_month', type: 'int', nullable: false })
  expirationMonth: number;

  @Column({ name: 'expiration_year', type: 'int', nullable: false })
  expirationYear: number;

  @Column({ name: 'cvv_encrypted', type: 'text', nullable: false })
  cvvEncrypted: string;

  @Column({ name: 'cardholder_name', type: 'varchar', length: 255, nullable: false })
  cardholderName: string;

  @Column({ name: 'pin_hash', type: 'varchar', length: 128, nullable: true })
  pinHash: string | null;

  @Column({ name: 'is_virtual', type: 'boolean', default: false })
  isVirtual: boolean;

  @Column({ name: 'is_tokenized', type: 'boolean', default: false })
  isTokenized: boolean;

  @Column({ name: 'token_references', type: 'jsonb', default: () => '\'[]\'::jsonb' })
  tokenReferences: string[];

  @Column({ name: 'daily_purchase_limit', type: 'numeric', precision: 18, scale: 2, default: 5000 })
  dailyPurchaseLimit: number;

  @Column({ name: 'daily_atm_limit', type: 'numeric', precision: 18, scale: 2, default: 1000 })
  dailyAtmLimit: number;

  @Column({ name: 'online_purchase_limit', type: 'numeric', precision: 18, scale: 2, default: 3000 })
  onlinePurchaseLimit: number;

  @Column({ name: 'monthly_purchase_limit', type: 'numeric', precision: 18, scale: 2, default: 20000 })
  monthlyPurchaseLimit: number;

  @Column({ name: 'credit_limit', type: 'numeric', precision: 18, scale: 2, nullable: true })
  creditLimit: number | null;

  @Column({ name: 'available_credit', type: 'numeric', precision: 18, scale: 2, default: 0 })
  availableCredit: number;

  @Column({ name: 'current_balance', type: 'numeric', precision: 18, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ name: 'controls_config', type: 'jsonb', default: () => '\'{}\'::jsonb' })
  controlsConfig: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: CardStatus.ISSUED })
  status: CardStatus;

  @Column({ name: 'block_reason', type: 'varchar', length: 100, nullable: true })
  blockReason: string | null;

  @Column({ name: 'activated_at', type: 'timestamptz', nullable: true })
  activatedAt: Date | null;

  @Column({ name: 'blocked_at', type: 'timestamptz', nullable: true })
  blockedAt: Date | null;

  @Column({ name: 'expires_at', type: 'date', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'renewed_from_card_id', type: 'uuid', nullable: true })
  renewedFromCardId: string | null;

  @Column({ name: 'issued_at', type: 'timestamptz', nullable: false })
  issuedAt: Date;
}
