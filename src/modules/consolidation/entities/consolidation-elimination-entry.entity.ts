import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum EliminationType {
  REVENUE_EXPENSE = 'revenue_expense',
  ASSET_LIABILITY = 'asset_liability',
  DIVIDEND = 'dividend',
  INTEREST = 'interest',
  INVENTORY_PROFIT = 'inventory_profit',
  OTHER = 'other',
}

export enum EliminationStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  PARTIAL = 'partial',
  MANUAL_OVERRIDE = 'manual_override',
  ELIMINATED = 'eliminated',
}

@Entity('consolidation_elimination_entry')
export class ConsolidationEliminationEntry extends BaseEntity {
  @Column({ name: 'run_id', type: 'uuid', nullable: false })
  runId: string;

  @Column({ name: 'elimination_code', type: 'varchar', length: 50, nullable: false })
  eliminationCode: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  eliminationType: EliminationType;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: EliminationStatus;

  @Column({ name: 'from_entity_id', type: 'uuid', nullable: false })
  fromEntityId: string;

  @Column({ name: 'to_entity_id', type: 'uuid', nullable: false })
  toEntityId: string;

  @Column({ name: 'account_from', type: 'varchar', length: 50, nullable: true })
  accountFrom: string | null;

  @Column({ name: 'account_to', type: 'varchar', length: 50, nullable: true })
  accountTo: string | null;

  @Column({ name: 'original_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  originalAmount: number;

  @Column({ name: 'original_currency', type: 'varchar', length: 3, nullable: false })
  originalCurrency: string;

  @Column({ name: 'eliminated_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  eliminatedAmount: number;

  @Column({ name: 'remaining_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  remainingAmount: number;

  @Column({ name: 'exchange_rate_applied', type: 'numeric', precision: 10, scale: 6, nullable: true })
  exchangeRateApplied: number | null;

  @Column({ name: 'match_confidence', type: 'numeric', precision: 5, scale: 2, nullable: true })
  matchConfidence: number | null;

  @Column({ name: 'auto_matched', type: 'boolean', default: false })
  autoMatched: boolean;

  @Column({ name: 'reference_document', type: 'varchar', length: 100, nullable: true })
  referenceDocument: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'matched_entry_id', type: 'uuid', nullable: true })
  matchedEntryId: string | null;
}
