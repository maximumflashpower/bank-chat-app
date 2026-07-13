import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { NettingType } from './netting-type.enum';
import { NettingStatus } from './netting-status.enum';

@Entity('recon_netting_batch')
export class ReconNettingBatch extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  nettingBatchNumber: string;

  @Column({ type: 'enum', enum: NettingType })
  nettingType: NettingType;

  @Column({ type: 'date' })
  periodDate: Date;

  @Column({ type: 'int', default: 0 })
  participantsCount: number;

  @Column({ type: 'int', default: 0 })
  grossObligationsCount: number;

  @Column({ type: 'int', default: 0 })
  netSettlementsCount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  grossVolumeTotal: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  netVolumeTotal: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  reductionPercentage: number;

  @Column({ type: 'enum', enum: NettingStatus, default: NettingStatus.CALCULATED })
  status: NettingStatus;

  @Column({ type: 'boolean', default: false })
  postedToLedger: boolean;

  @Column({ type: 'uuid', nullable: true })
  journalEntryId: string;

  @Column({ type: 'uuid', nullable: true })
  executedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  executedAt: Date;
}
