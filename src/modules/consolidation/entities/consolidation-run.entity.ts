import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum ConsolidationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ELIMINATING = 'eliminating',
  TRANSLATING = 'translating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  APPROVED = 'approved',
}

@Entity('consolidation_run')
export class ConsolidationRun extends BaseEntity {
  @Column({ name: 'run_code', type: 'varchar', length: 50, unique: true, nullable: false })
  runCode: string;

  @Column({ name: 'parent_entity_id', type: 'uuid', nullable: false })
  parentEntityId: string;

  @Column({ name: 'reporting_period_start', type: 'date', nullable: false })
  reportingPeriodStart: Date;

  @Column({ name: 'reporting_period_end', type: 'date', nullable: false })
  reportingPeriodEnd: Date;

  @Column({ name: 'reporting_currency', type: 'varchar', length: 3, default: 'USD' })
  reportingCurrency: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: ConsolidationStatus;

  @Column({ name: 'total_entities_consolidated', type: 'integer', default: 0 })
  totalEntitiesConsolidated: number;

  @Column({ name: 'total_eliminations', type: 'integer', default: 0 })
  totalEliminations: number;

  @Column({ name: 'total_translations', type: 'integer', default: 0 })
  totalTranslations: number;

  @Column({ name: 'goodwill_adjustment', type: 'numeric', precision: 18, scale: 2, default: 0 })
  goodwillAdjustment: number;

  @Column({ name: 'minority_interest_total', type: 'numeric', precision: 18, scale: 2, default: 0 })
  minorityInterestTotal: number;

  @Column({ name: 'exchange_rate_date', type: 'date', nullable: true })
  exchangeRateDate: Date | null;

  @Column({ name: 'prepared_by', type: 'uuid', nullable: false })
  preparedBy: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'completion_percentage', type: 'numeric', precision: 5, scale: 2, default: 0 })
  completionPercentage: number;

  @Column({ name: 'error_details', type: 'jsonb', nullable: true })
  errorDetails: Record<string, unknown> | null;
}
