import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum TransferType {
  INTERNAL = 'internal',
  ACH = 'ach',
  WIRE = 'wire',
  P2P = 'p2p',
  SEPA = 'sepa',
}

export enum TransferFrequency {
  ONE_TIME = 'one_time',
  RECURRING = 'recurring',
}

export enum RecurringFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export enum TransferStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('retail_transfer_instruction')
export class RetailTransferInstruction extends BaseEntity {
  @Column({ name: 'instruction_number', type: 'varchar', length: 50, unique: true, nullable: false })
  instructionNumber: string;

  @Column({ name: 'source_account_id', type: 'uuid', nullable: false })
  sourceAccountId: string;

  @Column({ name: 'destination_account_number', type: 'varchar', length: 50, nullable: false })
  destinationAccountNumber: string;

  @Column({ name: 'destination_bank_routing', type: 'varchar', length: 50, nullable: true })
  destinationBankRouting: string | null;

  @Column({ name: 'destination_beneficiary_name', type: 'varchar', length: 255, nullable: true })
  destinationBeneficiaryName: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'transfer_type', type: 'varchar', length: 20, nullable: false })
  transferType: TransferType;

  @Column({ type: 'varchar', length: 20, default: 'one_time' })
  frequency: TransferFrequency;

  @Column({ name: 'recurring_frequency', type: 'varchar', length: 20, nullable: true })
  recurringFrequency: RecurringFrequency | null;

  @Column({ name: 'recurring_start_date', type: 'date', nullable: true })
  recurringStartDate: Date | null;

  @Column({ name: 'recurring_end_date', type: 'date', nullable: true })
  recurringEndDate: Date | null;

  @Column({ name: 'next_execution_date', type: 'date', nullable: true })
  nextExecutionDate: Date | null;

  @Column({ name: 'execution_count', type: 'integer', default: 0 })
  executionCount: number;

  @Column({ name: 'memo_note', type: 'text', nullable: true })
  memoNote: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: TransferStatus;

  @Column({ name: 'payment_instruction_id', type: 'uuid', nullable: true })
  paymentInstructionId: string | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string | null;

  @Column({ name: 'initiated_by', type: 'uuid', nullable: false })
  initiatedBy: string;
}
