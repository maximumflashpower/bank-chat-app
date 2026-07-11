import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { TimeApprovalStatus } from './time-approval-status.enum';

@Entity('smb_time_entry_log')
export class TimeEntryLog extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  projectId: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'date' })
  entryDate: Date;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  hoursLogged: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  taskDescription: string;

  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true })
  hourlyRate: number;

  @Column({ type: 'numeric', precision: 19, scale: 4, nullable: true })
  billableAmount: number;

  @Column({
    type: 'enum',
    enum: TimeApprovalStatus,
    default: TimeApprovalStatus.PENDING
  })
  approvalStatus: TimeApprovalStatus;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectionReason: string;
}
