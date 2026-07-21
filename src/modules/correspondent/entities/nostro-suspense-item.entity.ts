import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('nostro_suspense_item')
export class NostroSuspenseItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  nostroAccountId: string;

  @Column({ type: 'uuid' })
  nostroTransactionLogId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionReferenceExt: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currencyIso: string;

  @Column({ type: 'char', length: 1 })
  debitCreditIndicator: string;

  @Column({ type: 'date' })
  valueDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'unmatched' })
  suspenseReason: string; // unmatched / partial_match / missing_reference / amount_mismatch / duplicate_suspect

  @Column({ type: 'text', nullable: true })
  investigationNotes: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string; // open / investigating / resolved / written_off

  @Column({ type: 'uuid', nullable: true })
  assignedToUserId: string;

  @Column({ type: 'uuid', nullable: true })
  resolutionJournalEntryId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  resolutionAction: string; // matched_manual / written_off / reversed / reposted

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  resolvedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
