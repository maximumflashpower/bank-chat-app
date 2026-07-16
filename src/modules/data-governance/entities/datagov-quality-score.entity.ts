import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

@Entity('datagov_quality_score')
export class DatagovQualityScore extends BaseEntity {
  @Column({ name: 'catalog_entry_id', type: 'uuid', nullable: false })
  catalogEntryId: string;

  @Column({ name: 'completeness_score', type: 'numeric', precision: 5, scale: 2, default: 0 })
  completenessScore: number;

  @Column({ name: 'accuracy_score', type: 'numeric', precision: 5, scale: 2, default: 0 })
  accuracyScore: number;

  @Column({ name: 'consistency_score', type: 'numeric', precision: 5, scale: 2, default: 0 })
  consistencyScore: number;

  @Column({ name: 'timeliness_score', type: 'numeric', precision: 5, scale: 2, default: 0 })
  timelinessScore: number;

  @Column({ name: 'overall_score', type: 'numeric', precision: 5, scale: 2, default: 0 })
  overallScore: number;

  @Column({ name: 'anomaly_detected', type: 'boolean', default: false })
  anomalyDetected: boolean;

  @Column({ name: 'validation_details', type: 'jsonb', nullable: true })
  validationDetails: Record<string, unknown> | null;

  @Column({ name: 'evaluated_at', type: 'timestamptz', nullable: true })
  evaluatedAt: Date | null;
}
