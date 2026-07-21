import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum SweepType {
  ZERO_BALANCE = 'zero_balance',
  TARGET_BALANCE = 'target_balance',
  THRESHOLD = 'threshold',
  EXCESS = 'excess',
}

export enum SweepFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum SweepDirection {
  BI_DIRECTIONAL = 'bi_directional',
  ONE_WAY_UP = 'one_way_up',
  ONE_WAY_DOWN = 'one_way_down',
}

@Entity('business_sweep_rule')
export class BusinessSweepRule extends BaseEntity {
  @Column({ name: 'rule_name', type: 'varchar', length: 255, nullable: false })
  ruleName: string;

  @Column({ name: 'source_account_id', type: 'uuid', nullable: false })
  sourceAccountId: string;

  @Column({ name: 'concentration_account_id', type: 'uuid', nullable: false })
  concentrationAccountId: string;

  @Column({ name: 'sweep_type', type: 'varchar', length: 30, nullable: false })
  sweepType: SweepType;

  @Column({ name: 'target_balance_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  targetBalanceAmount: number | null;

  @Column({ name: 'threshold_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  thresholdAmount: number | null;

  @Column({ name: 'sweep_frequency', type: 'varchar', length: 20, nullable: false })
  sweepFrequency: SweepFrequency;

  @Column({ name: 'sweep_execution_time', type: 'time', nullable: false })
  sweepExecutionTime: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  direction: SweepDirection;

  @Column({ name: 'min_sweep_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  minSweepAmount: number | null;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_executed_at', type: 'timestamptz', nullable: true })
  lastExecutedAt: Date | null;

  @Column({ name: 'execution_count', type: 'integer', default: 0 })
  executionCount: number;

  @Column({ name: 'total_swept_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalSweptAmount: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;
}
