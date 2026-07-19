import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum RedemptionType {
  CASHBACK = 'cashback',
  GIFT_CARD = 'gift_card',
  TRAVEL = 'travel',
  MERCHANDISE = 'merchandise',
  DONATION = 'donation',
  EXPERIENCE = 'experience',
  ACCOUNT_CREDIT = 'account_credit',
  BILL_PAYMENT = 'bill_payment',
}

export enum CatalogStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  EXPIRED = 'expired',
}

@Entity('loyalty_redemption_catalog')
export class LoyaltyRedemptionCatalog extends BaseEntity {
  @Column({ name: 'program_id', type: 'uuid', nullable: false })
  programId: string;

  @Column({ name: 'reward_name', type: 'varchar', length: 200, nullable: false })
  rewardName: string;

  @Column({ name: 'reward_description', type: 'text', nullable: true })
  rewardDescription: string | null;

  @Column({ name: 'redemption_type', type: 'varchar', length: 30, nullable: false })
  redemptionType: RedemptionType;

  @Column({ name: 'points_required', type: 'numeric', precision: 18, scale: 2, nullable: false })
  pointsRequired: number;

  @Column({ name: 'cash_value', type: 'numeric', precision: 18, scale: 2, nullable: false })
  cashValue: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'category', type: 'varchar', length: 50, nullable: true })
  category: string | null;

  @Column({ name: 'subcategory', type: 'varchar', length: 50, nullable: true })
  subcategory: string | null;

  @Column({ name: 'brand', type: 'varchar', length: 100, nullable: true })
  brand: string | null;

  @Column({ name: 'merchant_partner_id', type: 'uuid', nullable: true })
  merchantPartnerId: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'terms_conditions', type: 'text', nullable: true })
  termsConditions: string | null;

  @Column({ name: 'stock_quantity', type: 'integer', nullable: true })
  stockQuantity: number | null;

  @Column({ name: 'unlimited_stock', type: 'boolean', default: true })
  unlimitedStock: boolean;

  @Column({ name: 'daily_redemption_limit', type: 'integer', nullable: true })
  dailyRedemptionLimit: number | null;

  @Column({ name: 'redemptions_today', type: 'integer', default: 0 })
  redemptionsToday: number;

  @Column({ name: 'total_redemptions_all_time', type: 'integer', default: 0 })
  totalRedemptionsAllTime: number;

  @Column({ name: 'minimum_tier_required', type: 'varchar', length: 50, nullable: true })
  minimumTierRequired: string | null;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate: Date | null;

  @Column({ name: 'available_from', type: 'timestamp', nullable: true })
  availableFrom: Date | null;

  @Column({ name: 'available_until', type: 'timestamp', nullable: true })
  availableUntil: Date | null;

  @Column({ type: 'varchar', length: 20, default: CatalogStatus.ACTIVE })
  status: CatalogStatus;

  @Column({ name: 'featured', type: 'boolean', default: false })
  featured: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ name: 'external_reference_id', type: 'varchar', length: 100, nullable: true })
  externalReferenceId: string | null;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: Record<string, any> | null;
}
