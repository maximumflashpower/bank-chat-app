import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum TierLevel {
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

@Entity('loyalty_tier_config')
export class LoyaltyTierConfig extends BaseEntity {
  @Column({ name: 'program_id', type: 'uuid', nullable: false })
  programId: string;

  @Column({ name: 'tier_level', type: 'varchar', length: 50, nullable: false })
  tierLevel: TierLevel;

  @Column({ name: 'tier_name', type: 'varchar', length: 100, nullable: false })
  tierName: string;

  @Column({ name: 'tier_display_order', type: 'integer', default: 0 })
  tierDisplayOrder: number;

  @Column({ name: 'minimum_points_threshold', type: 'numeric', precision: 18, scale: 2, nullable: false })
  minimumPointsThreshold: number;

  @Column({ name: 'earning_multiplier', type: 'numeric', precision: 5, scale: 2, default: 1 })
  earningMultiplier: number;

  @Column({ name: 'redemption_discount_pct', type: 'numeric', precision: 5, scale: 2, default: 0 })
  redemptionDiscountPct: number;

  @Column({ name: 'bonus_points_on_qualify', type: 'numeric', precision: 18, scale: 2, default: 0 })
  bonusPointsOnQualify: number;

  @Column({ name: 'priority_support', type: 'boolean', default: false })
  prioritySupport: boolean;

  @Column({ name: 'exclusive_offers', type: 'boolean', default: false })
  exclusiveOffers: boolean;

  @Column({ name: 'free_shipping', type: 'boolean', default: false })
  freeShipping: boolean;

  @Column({ name: 'birthday_bonus_points', type: 'numeric', precision: 18, scale: 2, default: 0 })
  birthdayBonusPoints: number;

  @Column({ name: 'annual_fee_waiver', type: 'boolean', default: false })
  annualFeeWaiver: boolean;

  @Column({ name: 'dedicated_account_manager', type: 'boolean', default: false })
  dedicatedAccountManager: boolean;

  @Column({ name: 'tier_color_hex', type: 'varchar', length: 7, nullable: true })
  tierColorHex: string | null;

  @Column({ name: 'tier_icon_url', type: 'text', nullable: true })
  tierIconUrl: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
