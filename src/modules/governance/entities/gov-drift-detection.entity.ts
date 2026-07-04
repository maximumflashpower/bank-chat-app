import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { DriftStatus } from './drift-status.enum';
import { Severity } from './severity.enum';

@Entity({ name: 'gov_drift_detections' })
export class GovDriftDetection extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  resourceType: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  resourceId: string;

  @Column({ type: 'jsonb' })
  expectedState: Record<string, any>;

  @Column({ type: 'jsonb' })
  actualState: Record<string, any>;

  @Column({ type: 'jsonb' })
  driftDiff: Record<string, any>;

  @Column({ type: 'enum', enum: Severity, default: Severity.MEDIUM })
  severity: Severity;

  @Column({ type: 'enum', enum: DriftStatus, default: DriftStatus.OPEN })
  status: DriftStatus;

  @Column({ type: 'text', nullable: true })
  remediationAction: string;

  @Column({ type: 'timestamptz', nullable: true })
  remediatedAt: Date;
}
