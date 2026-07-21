import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum PayrollValidationStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  FAILED_VALIDATION = 'failed_validation',
}

export enum PayrollExecutionStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

export enum PaymentMethod {
  ACH = 'ach',
  WIRE = 'wire',
  MIXED = 'mixed',
}

export enum FileFormat {
  NACHA = 'nacha',
  CSV = 'csv',
  EXCEL = 'excel',
  API = 'api',
}

@Entity('business_payroll_batch')
export class BusinessPayrollBatch extends BaseEntity {
  @Column({ name: 'batch_number', type: 'varchar', length: 50, unique: true, nullable: false })
  batchNumber: string;

  @Column({ name: 'source_account_id', type: 'uuid', nullable: false })
  sourceAccountId: string;

  @Column({ name: 'total_employees', type: 'integer', nullable: false })
  totalEmployees: number;

  @Column({ name: 'total_gross_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  totalGrossAmount: number;

  @Column({ name: 'total_net_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  totalNetAmount: number;

  @Column({ name: 'total_taxes_withheld', type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalTaxesWithheld: number | null;

  @Column({ name: 'total_deductions', type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalDeductions: number | null;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'effective_date', type: 'date', nullable: false })
  effectiveDate: Date;

  @Column({ name: 'payment_method', type: 'varchar', length: 20, nullable: false })
  paymentMethod: PaymentMethod;

  @Column({ name: 'file_format_uploaded', type: 'varchar', length: 20, nullable: true })
  fileFormatUploaded: FileFormat | null;

  @Column({ name: 'validation_status', type: 'varchar', length: 20, default: 'pending' })
  validationStatus: PayrollValidationStatus;

  @Column({ name: 'execution_status', type: 'varchar', length: 20, default: 'pending' })
  executionStatus: PayrollExecutionStatus;

  @Column({ name: 'payment_instruction_id', type: 'uuid', nullable: true })
  paymentInstructionId: string | null;

  @Column({ name: 'ledger_journal_entry_id', type: 'uuid', nullable: true })
  ledgerJournalEntryId: string | null;

  @Column({ name: 'validated_at', type: 'timestamptz', nullable: true })
  validatedAt: Date | null;

  @Column({ name: 'executed_at', type: 'timestamptz', nullable: true })
  executedAt: Date | null;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy: string | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;
}
