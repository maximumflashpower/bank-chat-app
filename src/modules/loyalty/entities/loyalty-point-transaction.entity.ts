import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum PointTransactionType {
  EARN = 'earn',
  REDEEM = 'redeem',
  EXPIRE = 'expire',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  ADJUST = 'adjust',
}

export enum BonusCategory {
  DINING = 'dining',
  TRAVEL = 'travel',
  GAS = 'gas',
  SHOPPING = 'shopping',
  GROCERY = 'grocery',
  ENTERTAINMENT = 'entertainment',
  UTILITY = 'utility',
  GENERAL = 'general',
}

@Entity('loyalty_point_transaction')
export class LoyaltyPointTransaction extends BaseEntity {
  @Column({ name: 'enrollment_id', type: 'uuid', nullable: false })
  enrollmentId: string;

  @Column({ name: 'program_id', type: 'uuid', nullable: false })
  programId: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: false })
  customerId: string;

  @Column({ name: 'point_transaction_type', type: 'varchar', length: 30, nullable: false })
  pointTransactionType: PointTransactionType;

  @Column({ name: 'source_transaction_id', type: 'uuid', nullable: true })
  sourceTransactionId: string | null;

  @Column({ name: 'multiplier_applied', type: 'numeric', precision: 5, scale: 2, default: 1 })
  multiplierApplied: number;

  @Column({ name: 'bonus_category', type: 'varchar', length: 50, nullable: true })
  bonusCategory: BonusCategory | null;

  @Column({ name: 'points_earned', type: 'numeric', precision: 18, scale: 2, default: 0 })
  pointsEarned: number;

  @Column({ name: 'points_redeemed', type: 'numeric', precision: 18, scale: 2, default: 0 })
  pointsRedeemed: number;

  @Column({ name: 'points_expired', type: 'numeric', precision: 18, scale: 2, default: 0 })
  pointsExpired: number;

  @Column({ name: 'points_transferred_in', type: 'numeric', precision: 18, scale: 2, default: 0 })
  pointsTransferredIn: number;

  @Column({ name: 'points_transferred_out', type: 'numeric', precision: 18, scale: 2, default: 0 })
  pointsTransferredOut: number;

  @Column({ name: 'net_points', type: 'numeric', precision: 18, scale: 2, default: 0 })
  netPoints: number;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ name: 'redemption_reference_id', type: 'uuid', nullable: true })
  redemptionReferenceId: string | null;

  @Column({ name: 'transfer_target_enrollment_id', type: 'uuid', nullable: true })
  transferTargetEnrollmentId: string | null;

  @Column({ name: 'merchant_partner_id', type: 'uuid', nullable: true })
  merchantPartnerId: string | null;

  @Column({ name: 'promotion_id', type: 'uuid', nullable: true })
  promotionId: string | null;

  @Column({ name: 'transaction_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  transactionDate: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date | null;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: Record<string, any> | null;
}
