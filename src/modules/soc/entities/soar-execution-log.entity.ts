import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ABORTED = 'ABORTED',
}

@Entity('soar_execution_log')
export class SoarExecutionLog extends BaseEntity {
  @Column({ name: 'playbook_id', type: 'uuid' })
  playbookId: string;

  @Column({ name: 'incident_id', type: 'uuid', nullable: true })
  incidentId: string | null;

  @Column({ name: 'triggered_by', type: 'uuid', nullable: true })
  triggeredBy: string | null;

  @Column({ type: 'enum', enum: ExecutionStatus, default: ExecutionStatus.PENDING })
  status: ExecutionStatus;

  @Column({ name: 'step_results', type: 'jsonb', nullable: true })
  stepResults: Record<string, unknown> | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'duration_minutes', type: 'numeric', precision: 6, scale: 2, nullable: true })
  durationMinutes: number | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;
}
