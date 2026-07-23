import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('reporting_calendar')
export class ReportingCalendar extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 255 })
  eventTitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  eventType: 'filing_deadline' | 'submission' | 'audit' | 'review' | 'meeting' | 'training' | 'regulatory_change';

  @Column({ type: 'varchar', length: 100 })
  filingType: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'overdue';

  @Column({ type: 'varchar', length: 50, default: 'normal' })
  priority: 'low' | 'normal' | 'high' | 'critical';

  @Column({ type: 'int', default: 0 })
  reminderDaysBefore: number;

  @Column({ type: 'jsonb', nullable: true })
  remindersSent: Array<{
    sentAt: string;
    recipient: string;
    method: 'email' | 'notification' | 'sms';
  }>;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{
    filename: string;
    path: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  relatedReports: string[];

  @Column({ type: 'jsonb', nullable: true })
  checklist: Array<{
    item: string;
    completed: boolean;
    completedAt?: string;
    completedBy?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  approvers: Array<{
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: string;
  }>;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  assignedTo: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'varchar', length: 50, default: 'internal' })
  visibility: 'internal' | 'regulatory_authority' | 'external_auditor';

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ type: 'timestamp', nullable: true })
  recurringEndDate: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recurrencePattern: string;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
