import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { LedgerJournalEntry } from './ledger_journal_entry.entity';

@Entity('inventory_journal_link')
export class InventoryJournalLink extends BaseEntity {
  @OneToOne(() => LedgerJournalEntry)
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry: LedgerJournalEntry;

  @Column({ type: 'uuid', unique: true })
  journalEntryId: string;

  @Column({ type: 'uuid', nullable: false })
  stockMovementId: string;

  @Column({ type: 'uuid', nullable: false })
  companyProfileId: string;

  @Column({ type: 'boolean', default: true })
  isReconciled: boolean;
}
