import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum IntercompanyTxnType {
  LOAN = 'loan',
  TRANSFER = 'transfer',
  COST_ALLOCATION = 'cost_allocation',
  SERVICE_FEE = 'service_fee',
  ROYALTY = 'royalty',
  DIVIDEND = 'dividend',
}

export enum IntercompanyStatus {
  PENDING = 'pending',
  POSTED = 'posted',
  ELIMINATED = 'eliminated',
  SETTLED = 'settled',
}

@Entity('ledger_intercompany_txns')
export class LedgerIntercompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'txn_code', type: 'varchar', length: 50, unique: true })
  txnCode: string;

  @Column({ name: 'txn_type', type: 'varchar', length: 20 })
  txnType: IntercompanyTxnType;

  @Column({ name: 'description', type: 'text', nullable: false })
  description: string;

  @Column({ name: 'from_entity_id', type: 'uuid', nullable: false })
  fromEntityId: string;

  @Column({ name: 'to_entity_id', type: 'uuid', nullable: false })
  toEntityId: string;

  @Column({ name: 'amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  amount: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'exchange_rate', type: 'numeric', precision: 18, scale: 6, nullable: true })
  exchangeRate: number | null;

  @Column({ name: 'amount_base_currency', type: 'numeric', precision: 18, scale: 2 })
  amountBaseCurrency: number;

  @Column({ name: 'txn_date', type: 'date', nullable: false })
  txnDate: Date;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'transfer_price_method', type: 'varchar', length: 30, nullable: true })
  transferPriceMethod: string | null;

  @Column({ name: 'cost_center_from', type: 'varchar', length: 50, nullable: true })
  costCenterFrom: string | null;

  @Column({ name: 'cost_center_to', type: 'varchar', length: 50, nullable: true })
  costCenterTo: string | null;

  @Column({ name: 'allocation_basis', type: 'varchar', length: 50, nullable: true })
  allocationBasis: string | null;

  @Column({ name: 'journal_entry_id', type: 'uuid', nullable: true })
  journalEntryId: string | null;

  @Column({ name: 'elimination_entry_id', type: 'uuid', nullable: true })
  eliminationEntryId: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: IntercompanyStatus;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
