import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { ReconMatchingBatch } from './recon-matching-batch.entity';
import { MatchType } from './match-type.enum';
import { MatchStatus } from './match-status.enum';

@Entity('recon_match_result')
export class ReconMatchingResult extends BaseEntity {
  @ManyToOne(() => ReconMatchingBatch, batch => batch.results, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: ReconMatchingBatch;

  @Column({ type: 'uuid', nullable: false })
  batchId: string;

  @Column({ type: 'enum', enum: MatchType })
  matchType: MatchType;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  matchConfidenceScore: number;

  @Column({ type: 'simple-array', nullable: true })
  sourceARefs: string[];

  @Column({ type: 'simple-array', nullable: true })
  sourceBRefs: string[];

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  amountA: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  amountB: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  amountDifference: number;

  @Column({ type: 'boolean', default: false })
  matchedManually: boolean;

  @Column({ type: 'uuid', nullable: true })
  matchedBy: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  matchReasonCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  unmatchedReason: string;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.MATCHED })
  status: MatchStatus;

  @Column({ type: 'uuid', nullable: true })
  journalEntryId: string;

  @Column({ type: 'uuid', nullable: true })
  suspenseClearingId: string;
}
