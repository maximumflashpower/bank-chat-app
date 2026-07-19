import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { LoyaltyProgram } from './loyalty-program.entity';

export enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  MIGRATED = 'migrated',
}

@Entity('customer_loyalty_enrollment')
export class CustomerLoyaltyEnrollment extends BaseEntity {
  @Column({ name: 'loyalty_program_id', type: 'uuid', nullable: false })
  loyaltyProgramId: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: false })
  customerId: string;

  @Column({ name: 'account_id', type: 'uuid', nullable: false })
  accountId: string;

  @Column({ name: 'enrollment_date', type: 'date', default: () => 'CURRENT_DATE' })
  enrollmentDate: Date;

  @Column({ name: 'current_tier_level', type: 'varchar', length: 50, nullable: true })
  currentTierLevel: string | null;

  @Column({ name: 'tier_effective_date', type: 'date', nullable: true })
  tierEffectiveDate: Date | null;

  @Column({ name: 'tier_next_review_date', type: 'date', nullable: true })
  tierNextReviewDate: Date | null;

  @Column({ name: 'total_points_earned_lifetime', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalPointsEarnedLifetime: number;

  @Column({ name: 'total_points_redeemed_lifetime', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalPointsRedeemedLifetime: number;

  @Column({ name: 'available_points_balance', type: 'numeric', precision: 18, scale: 2, default: 0 })
  availablePointsBalance: number;

  @Column({ name: 'expiring_points_soon', type: 'numeric', precision: 18, scale: 2, default: 0 })
  expiringPointsSoon: number;

  @Column({ name: 'last_activity_date', type: 'date', nullable: true })
  lastActivityDate: Date | null;

  @Column({ name: 'opt_in_communications', type: 'boolean', default: true })
  optInCommunications: boolean;

  @Column({ name: 'referral_code', type: 'varchar', length: 50, nullable: true })
  referralCode: string | null;

  @Column({ name: 'referred_by_user_id', type: 'uuid', nullable: true })
  referredByUserId: string | null;

  @Column({ name: 'enrolled_source', type: 'varchar', length: 50 })
  enrolledSource: string;

  @Column({ type: 'varchar', length: 20, default: EnrollmentStatus.ENROLLED })
  status: EnrollmentStatus;
}
