import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum PromotionType {
  MULTIPLIER = 'multiplier',
  FIXED_BONUS = 'fixed_bonus',
  CATEGORY_BONUS = 'category_bonus',
  FIRST_PURCHASE = 'first_purchase',
  REFERRAL_BONUS = 'referral_bonus',
  ANNIVERSARY = 'anniversary',
}

export enum PromotionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('loyalty_promotion')
export class LoyaltyPromotion extends BaseEntity {
  @Column({ name: 'program_id', type: 'uuid', nullable: false })
  programId: string;

  @Column({ name: 'promotion_code', type: 'varchar', length: 50, nullable: false })
  promotionCode: string;

  @Column({ name: 'promotion_name', type: 'varchar', length: 200, nullable: false })
  promotionName: string;

  @Column({ name: 'promotion_description', type: 'text', nullable: true })
  promotionDescription: string | null;

  @Column({ name: 'promotion_type', type: 'varchar', length: 30, nullable: false })
  promotionType: PromotionType;

  @Column({ type: 'varchar', length: 20, default: PromotionStatus.SCHEDULED })
  status: PromotionStatus;

  @Column({ name: 'start_date', type: 'timestamp', nullable: false })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: false })
  endDate: Date;

  @Column({ name: 'multiplier_value', type: 'numeric', precision: 5, scale: 2, default: 1 })
  multiplierValue: number;

  @Column({ name: 'fixed_bonus_points', type: 'numeric', precision: 18, scale: 2, default: 0 })
  fixedBonusPoints: number;

  @Column({ name: 'eligible_categories', type: 'text', array: true, nullable: true })
  eligibleCategories: string[] | null;

  @Column({ name: 'min_transaction_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  minTransactionAmount: number;

  @Column({ name: 'max_bonus_per_customer', type: 'numeric', precision: 18, scale: 2, nullable: true })
  maxBonusPerCustomer: number | null;

  @Column({ name: 'total_budget_points', type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalBudgetPoints: number | null;

  @Column({ name: 'points_awarded_so_far', type: 'numeric', precision: 18, scale: 2, default: 0 })
  pointsAwardedSoFar: number;

  @Column({ name: 'eligible_tiers', type: 'text', array: true, nullable: true })
  eligibleTiers: string[] | null;

  @Column({ name: 'target_segment', type: 'varchar', length: 50, nullable: true })
  targetSegment: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'activated_at', type: 'timestamp', nullable: true })
  activatedAt: Date | null;

  @Column({ name: 'paused_at', type: 'timestamp', nullable: true })
  pausedAt: Date | null;
}
