import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { ReconMatchingResult } from './recon-match-result.entity';
import { ReconType } from './recon-type.enum';
import { BatchStatus } from './batch-status.enum';

@Entity('recon_matching_batch')
export class ReconMatchingBatch extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  batchNumber: string;

  @Column({ type: 'enum', enum: ReconType })
  reconType: ReconType;

  @Column({ type: 'varchar', length: 100 })
  sourceSystemA: string;

  @Column({ type: 'varchar', length: 100 })
  sourceSystemB: string;

  @Column({ type: 'date' })
  periodStartDate: Date;

  @Column({ type: 'date' })
  periodEndDate: Date;

  @Column({ type: 'int', default: 0 })
  totalItemsSourceA: number;

  @Column({ type: 'int', default: 0 })
  totalItemsSourceB: number;

  @Column({ type: 'int', default: 0 })
  matchedCount: number;

  @Column({ type: 'int', default: 0 })
  unmatchedCountA: number;

  @Column({ type: 'int', default: 0 })
  unmatchedCountB: number;

  @Column({ type: 'int', default: 0 })
  partialMatchCount: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  matchRatePercent: number;

  @Column({ type: 'varchar', length: 50, default: 'v1.0' })
  algorithmVersion: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  fuzzyToleranceAmount: number;

  @Column({ type: 'int', nullable: true })
  fuzzyToleranceDays: number;

  @Column({ type: 'enum', enum: BatchStatus, default: BatchStatus.PENDING })
  status: BatchStatus;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', nullable: true })
  processingTimeMs: number;

  @Column({ type: 'uuid', nullable: true })
  triggeredBy: string;

  @OneToMany(() => ReconMatchingResult, result => result.batch)
  results: ReconMatchingResult[];
}
