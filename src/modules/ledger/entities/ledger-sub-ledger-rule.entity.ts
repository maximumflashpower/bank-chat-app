import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SubLedgerType {
  ACCOUNTS_RECEIVABLE = 'accounts_receivable',
  ACCOUNTS_PAYABLE = 'accounts_payable',
  INVENTORY = 'inventory',
  FIXED_ASSETS = 'fixed_assets',
  PAYROLL = 'payroll',
  EXPENSES = 'expenses',
  OTHER = 'other',
}

export enum DistributionRuleType {
  PERCENTAGE = 'percentage',
  FLAT_AMOUNT = 'flat_amount',
  PROPORTIONAL = 'proportional',
}

export enum DistributionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

@Entity('ledger_sub_ledger_rules')
export class LedgerSubLedgerRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'rule_code', type: 'varchar', length: 50, unique: true })
  ruleCode: string;

  @Column({ name: 'rule_name', type: 'varchar', length: 255 })
  ruleName: string;

  @Column({ name: 'sub_ledger_type', type: 'varchar', length: 20 })
  subLedgerType: SubLedgerType;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'gl_account_id', type: 'uuid', nullable: false })
  glAccountId: string;

  @Column({ name: 'distribution_type', type: 'varchar', length: 20 })
  distributionType: DistributionRuleType;

  @Column({ name: 'distribution_config', type: 'jsonb', nullable: true })
  distributionConfig: Record<string, unknown> | null;

  @Column({ name: 'auto_post', type: 'boolean', default: false })
  autoPost: boolean;

  @Column({ name: 'requires_approval', type: 'boolean', default: false })
  requiresApproval: boolean;

  @Column({ name: 'approval_threshold', type: 'numeric', precision: 18, scale: 2, nullable: true })
  approvalThreshold: number | null;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'effective_from', type: 'date', nullable: false })
  effectiveFrom: Date;

  @Column({ name: 'effective_until', type: 'date', nullable: true })
  effectiveUntil: Date | null;

  @Column({ name: 'last_run_at', type: 'timestamptz', nullable: true })
  lastRunAt: Date | null;

  @Column({ name: 'total_posts', type: 'int', default: 0 })
  totalPosts: number;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: DistributionStatus;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('ledger_sub_ledger_entries')
export class LedgerSubLedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'entry_code', type: 'varchar', length: 50 })
  entryCode: string;

  @Column({ name: 'sub_ledger_type', type: 'varchar', length: 20 })
  subLedgerType: SubLedgerType;

  @Column({ name: 'sub_ledger_entity_id', type: 'uuid', nullable: false })
  subLedgerEntityId: string;

  @Column({ name: 'sub_ledger_reference', type: 'varchar', length: 255, nullable: false })
  subLedgerReference: string;

  @Column({ name: 'rule_id', type: 'uuid', nullable: false })
  ruleId: string;

  @Column({ name: 'gl_account_id', type: 'uuid', nullable: false })
  glAccountId: string;

  @Column({ name: 'debit_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  debitAmount: number;

  @Column({ name: 'credit_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  creditAmount: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'transaction_date', type: 'date', nullable: false })
  transactionDate: Date;

  @Column({ name: 'journal_entry_id', type: 'uuid', nullable: true })
  journalEntryId: string | null;

  @Column({ name: 'segment_branch_id', type: 'uuid', nullable: true })
  segmentBranchId: string | null;

  @Column({ name: 'segment_dept_id', type: 'uuid', nullable: true })
  segmentDeptId: string | null;

  @Column({ name: 'segment_project_id', type: 'uuid', nullable: true })
  segmentProjectId: string | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'reference_doc', type: 'varchar', length: 255, nullable: true })
  referenceDoc: string | null;

  @Column({ name: 'posted', type: 'boolean', default: false })
  posted: boolean;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
