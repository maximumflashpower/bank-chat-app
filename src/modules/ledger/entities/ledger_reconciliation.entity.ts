import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { LedgerFiscalPeriod } from './ledger_fiscal_period.entity';
import { ReconciliationStatus } from './reconciliation-status.enum';

@Entity('ledger_reconciliation')
export class LedgerReconciliation extends BaseEntity {
  @Column({ type: 'uuid' })
  bank_account_id: string;

  @ManyToOne(() => LedgerFiscalPeriod)
  @JoinColumn({ name: 'period_id' })
  period: LedgerFiscalPeriod;

  @Column({ type: 'uuid' })
  period_id: string;

  @Column({ type: 'date' })
  statement_date: Date;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  statement_balance: number;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  book_balance: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  difference: number;

  @Column({
    type: 'enum',
    enum: ReconciliationStatus,
    default: ReconciliationStatus.PENDING,
  })
  status: ReconciliationStatus;

  @Column({ type: 'int', default: 0 })
  matched_count: number;

  @Column({ type: 'int', default: 0 })
  unmatched_book: number;

  @Column({ type: 'int', default: 0 })
  unmatched_bank: number;

  @Column({ type: 'uuid', nullable: true })
  reconciled_by: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reconciled_at: Date | null;
}
