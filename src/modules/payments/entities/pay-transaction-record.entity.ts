import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { PayInstruction } from './pay-instruction.entity';

@Entity('pay_transaction_record')
export class PayTransactionRecord extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  instructionId: string;

  @Column({ type: 'date', nullable: false })
  transactionDate: Date;

  @Column({ type: 'date', nullable: false })
  valueDate: Date;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'QUEUED' })
  executionStatus: string;

  @Column({ type: 'text', nullable: true })
  bankResponseMessage?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankReferenceCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  clearingSystemRef?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  feesChargedTotal?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  intermediaryBankFee?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  beneficiaryReceivedNet?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  failedErrorCode?: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  retryCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastRetryAt?: Date;

  @Column({ type: 'varchar', length: 3, nullable: true })
  settledCurrency?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  settledAmountActual?: number;

  @Column({ type: 'numeric', precision: 18, scale: 4, nullable: true })
  exchangeGainLoss?: number;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @ManyToOne(() => PayInstruction)
  @JoinColumn({ name: 'instructionId' })
  instruction?: PayInstruction;
}
