import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum ProgramType {
  POINTS = 'points',
  CASHBACK = 'cashback',
  HYBRID = 'hybrid',
  TIERED = 'tiered',
  PARTNERSHIP = 'partnership',
}

export enum ProgramStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  TERMINATED = 'terminated',
}

@Entity('loyalty_program')
export class LoyaltyProgram extends BaseEntity {
  @Column({ name: 'program_name', type: 'varchar', length: 255, nullable: false })
  programName: string;

  @Column({ name: 'program_code', type: 'varchar', length: 50, unique: true, nullable: false })
  programCode: string;

  @Column({ name: 'program_type', type: 'varchar', length: 20, nullable: false })
  programType: ProgramType;

  @Column({ name: 'currency_unit_name', type: 'varchar', length: 50, nullable: false })
  currencyUnitName: string;

  @Column({ name: 'base_earning_rate', type: 'numeric', precision: 8, scale: 5, nullable: false, default: 1.0 })
  baseEarningRate: number;

  @Column({ name: 'default_points_expiry_months', type: 'int', nullable: true })
  defaultPointsExpiryMonths: number | null;

  @Column({ name: 'allow_partial_redemption', type: 'boolean', default: true })
  allowPartialRedemption: boolean;

  @Column({ name: 'allow_transfer_between_users', type: 'boolean', default: false })
  allowTransferBetweenUsers: boolean;

  @Column({ name: 'minimum_redemption_threshold', type: 'numeric', precision: 18, scale: 2, nullable: true })
  minimumRedemptionThreshold: number | null;

  @Column({ name: 'reward_tiers_enabled', type: 'boolean', default: true })
  rewardTiersEnabled: boolean;

  @Column({ type: 'varchar', length: 20, default: ProgramStatus.ACTIVE })
  status: ProgramStatus;

  @Column({ name: 'joined_customer_count', type: 'int', default: 0 })
  joinedCustomerCount: number;
}
