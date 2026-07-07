import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { LedgerFiscalPeriod } from './ledger_fiscal_period.entity';
import { JournalEntryStatus } from './journal-entry-status.enum';
import { JournalSourceType } from './journal-source-type.enum';

@Entity('ledger_journal_entry')
export class LedgerJournalEntry extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  entry_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string;

  @Column({ type: 'text' })
  description: string;

  @ManyToOne(() => LedgerFiscalPeriod)
  @JoinColumn({ name: 'fiscal_period_id' })
  fiscal_period: LedgerFiscalPeriod;

  @Column({ type: 'uuid' })
  fiscal_period_id: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  total_debit: number;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  total_credit: number;

  @Column({ type: 'boolean', default: false })
  is_balanced: boolean;

  @Column({
    type: 'enum',
    enum: JournalEntryStatus,
    default: JournalEntryStatus.DRAFT,
  })
  status: JournalEntryStatus;

  @ManyToOne(() => LedgerJournalEntry, { nullable: true })
  @JoinColumn({ name: 'reversed_by_id' })
  reversed_by: LedgerJournalEntry;

  @Column({ type: 'uuid', nullable: true })
  reversed_by_id: string | null;

  @Column({ type: 'enum', enum: JournalSourceType })
  source_type: JournalSourceType;

  @Column({ type: 'varchar', length: 100 })
  source_entity: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  posted_at: Date | null;
}
