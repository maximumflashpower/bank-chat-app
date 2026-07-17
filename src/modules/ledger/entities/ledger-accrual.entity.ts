import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AccrualType {
  ACCRUAL = 'accrual',
  DEFERRAL = 'deferral',
  PREPAYMENT = 'prepayment',
  AMORTIZATION = 'amortization',
}

export enum AccrualStatus {
  ACTIVE = 'active',
  FULLY_AMORTIZED = 'fully_amortized',
  REVERSED = 'reversed',
}

@Entity('ledger_accruals')
export class LedgerAccrual {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'accrual_code', type: 'varchar', length: 50, unique: true })
  accrualCode: string;

  @Column({ name: 'description', type: 'text', nullable: false })
  description: string;

  @Column({ name: 'accrual_type', type: 'varchar', length: 20 })
  accrualType: AccrualType;

  @Column({ name: 'total_amount', type: 'numeric', precision: 18, scale: 2 })
  totalAmount: number;

  @Column({ name: 'amortized_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  amortizedAmount: number;

  @Column({ name: 'remaining_amount', type: 'numeric', precision: 18, scale: 2 })
  remainingAmount: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'start_date', type: 'date', nullable: false })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: false })
  endDate: Date;

  @Column({ name: 'periods_total', type: 'int', nullable: false })
  periodsTotal: number;

  @Column({ name: 'periods_amortized', type: 'int', default: 0 })
  periodsAmortized: number;

  @Column({ name: 'periodicity', type: 'varchar', length: 20, default: 'monthly' })
  periodicity: string;

  @Column({ name: 'debit_account_id', type: 'uuid', nullable: false })
  debitAccountId: string;

  @Column({ name: 'credit_account_id', type: 'uuid', nullable: false })
  creditAccountId: string;

  @Column({ name: 'segment_branch_id', type: 'uuid', nullable: true })
  segmentBranchId: string | null;

  @Column({ name: 'segment_dept_id', type: 'uuid', nullable: true })
  segmentDeptId: string | null;

  @Column({ name: 'segment_project_id', type: 'uuid', nullable: true })
  segmentProjectId: string | null;

  @Column({ name: 'journal_entry_id', type: 'uuid', nullable: true })
  journalEntryId: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: AccrualStatus;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
