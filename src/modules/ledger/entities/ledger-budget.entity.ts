import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BudgetType {
  OPERATING = 'operating',
  CAPITAL = 'capital',
  CASH_FLOW = 'cash_flow',
  PROJECT = 'project',
  DEPARTMENTAL = 'departmental',
}

export enum BudgetStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  REVISED = 'revised',
  CLOSED = 'closed',
}

export enum EncumbranceType {
  COMMITMENT = 'commitment',
  OBLIGATION = 'obligation',
  EXPENDITURE = 'expenditure',
}

export enum EncumbranceStatus {
  OPEN = 'open',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

@Entity('ledger_budgets')
export class LedgerBudget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'budget_code', type: 'varchar', length: 50, unique: true })
  budgetCode: string;

  @Column({ name: 'budget_name', type: 'varchar', length: 255 })
  budgetName: string;

  @Column({ name: 'budget_type', type: 'varchar', length: 20 })
  budgetType: BudgetType;

  @Column({ name: 'fiscal_year', type: 'int', nullable: false })
  fiscalYear: number;

  @Column({ name: 'fiscal_period_id', type: 'uuid', nullable: true })
  fiscalPeriodId: string | null;

  @Column({ name: 'account_id', type: 'uuid', nullable: false })
  accountId: string;

  @Column({ name: 'segment_branch_id', type: 'uuid', nullable: true })
  segmentBranchId: string | null;

  @Column({ name: 'segment_dept_id', type: 'uuid', nullable: true })
  segmentDeptId: string | null;

  @Column({ name: 'segment_project_id', type: 'uuid', nullable: true })
  segmentProjectId: string | null;

  @Column({ name: 'budgeted_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  budgetedAmount: number;

  @Column({ name: 'actual_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  actualAmount: number;

  @Column({ name: 'committed_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  committedAmount: number;

  @Column({ name: 'encumbered_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  encumberedAmount: number;

  @Column({ name: 'remaining_balance', type: 'numeric', precision: 18, scale: 2, default: 0 })
  remainingBalance: number;

  @Column({ name: 'variance_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  varianceAmount: number;

  @Column({ name: 'variance_percentage', type: 'numeric', precision: 8, scale: 2, default: 0 })
  variancePercentage: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: BudgetStatus;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('ledger_encumbrances')
export class LedgerEncumbrance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'encumbrance_code', type: 'varchar', length: 50, unique: true })
  encumbranceCode: string;

  @Column({ name: 'encumbrance_type', type: 'varchar', length: 20 })
  encumbranceType: EncumbranceType;

  @Column({ name: 'description', type: 'text', nullable: false })
  description: string;

  @Column({ name: 'budget_id', type: 'uuid', nullable: false })
  budgetId: string;

  @Column({ name: 'account_id', type: 'uuid', nullable: false })
  accountId: string;

  @Column({ name: 'amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  amount: number;

  @Column({ name: 'fulfilled_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  fulfilledAmount: number;

  @Column({ name: 'remaining_amount', type: 'numeric', precision: 18, scale: 2 })
  remainingAmount: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'reference_doc', type: 'varchar', length: 255, nullable: true })
  referenceDoc: string | null;

  @Column({ name: 'encumbrance_date', type: 'date', nullable: false })
  encumbranceDate: Date;

  @Column({ name: 'expected_fulfillment_date', type: 'date', nullable: true })
  expectedFulfillmentDate: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: EncumbranceStatus;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
