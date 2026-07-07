import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { LedgerJournalEntry } from './ledger_journal_entry.entity';
import { LedgerChartOfAccounts } from './ledger_chart_of_accounts.entity';
import { JournalLineReconStatus } from './journal-line-recon-status.enum';

@Entity('ledger_journal_line')
export class LedgerJournalLine extends BaseEntity {
  @ManyToOne(() => LedgerJournalEntry, (je) => je.id, { cascade: true })
  @JoinColumn({ name: 'journal_entry_id' })
  journal_entry: LedgerJournalEntry;

  @Column({ type: 'uuid' })
  journal_entry_id: string;

  @ManyToOne(() => LedgerChartOfAccounts)
  @JoinColumn({ name: 'account_id' })
  account: LedgerChartOfAccounts;

  @Column({ type: 'uuid' })
  account_id: string;

  @Column({ type: 'uuid', nullable: true })
  segment_branch_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  segment_dept_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  segment_project_id: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  credit: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'date' })
  effective_date: Date;

  @Column({ type: 'text', nullable: true })
  line_description: string | null;

  @Column({
    type: 'enum',
    enum: JournalLineReconStatus,
    default: JournalLineReconStatus.UNMATCHED,
  })
  reconciliation_status: JournalLineReconStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_ref_id: string | null;
}
