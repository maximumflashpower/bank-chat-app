import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { ReconMatchingBatch } from './recon-matching-batch.entity';
import { BreakType } from './break-type.enum';
import { BreakSeverity } from './break-severity.enum';
import { BreakStatus } from './break-status.enum';

@Entity('recon_inter_system_break')
export class ReconInterSystemBreak extends BaseEntity {
  @ManyToOne(() => ReconMatchingBatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: ReconMatchingBatch;

  @Column({ type: 'uuid', nullable: false })
  batchId: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  ledgerBalance: number;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  subledgerBalance: number;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  varianceAmount: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  variancePercentage: number;

  @Column({ type: 'enum', enum: BreakType, nullable: true })
  breakType: BreakType;

  @Column({ type: 'enum', enum: BreakSeverity, nullable: true })
  breakSeverity: BreakSeverity;

  @Column({ type: 'text', nullable: true })
  rootCauseAnalysis: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  resolutionAction: string;

  @Column({ type: 'uuid', nullable: true })
  adjustmentEntryId: string;

  @Column({ type: 'enum', enum: BreakStatus, default: BreakStatus.OPEN })
  status: BreakStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedTo: string;

  @Column({ type: 'uuid', nullable: true })
  resolvedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date;
}
