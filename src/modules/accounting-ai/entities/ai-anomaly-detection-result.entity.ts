import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('ai_anomaly_detection_result')
export class AiAnomalyDetectionResult extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  journalEntryId: string;

  @Column({ type: 'text', array: true, nullable: true })
  anomalyTypesFound?: string[];

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: false })
  riskScore: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  comparisonBaselineAvg?: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  currentDeviationPct?: number;

  @Column({ type: 'int', nullable: true })
  similarHistoricalCasesCount?: number;

  @Column({ type: 'uuid', nullable: true })
  investigatorAssigned?: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'new' })
  investigationStatus: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  flaggedForFraud: boolean;

  @Column({ type: 'jsonb', nullable: true })
  evidenceSnapshotJson?: any;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'investigatorAssigned' })
  investigatorUser?: IdentityUser;
}
