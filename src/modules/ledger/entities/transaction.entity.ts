import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { Account } from './account.entity';
import { TransactionType } from './transaction-type.enum';
import { TransactionStatus } from './transaction-status.enum';

@Entity({ name: 'transactions' })
export class Transaction extends BaseEntity {
  @ApiProperty({ type: String, description: 'Account UUID (source or sole account)' })
  @Index()
  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @ApiProperty({ type: String, description: 'Counterparty account UUID (for transfers)', required: false })
  @Column({ name: 'counterparty_account_id', type: 'uuid', nullable: true })
  counterpartyAccountId: string | null;

  @ApiProperty({ enum: TransactionType, example: TransactionType.TRANSFER_OUT })
  @Column({ name: 'type', type: 'enum', enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.COMPLETED })
  @Column({ name: 'status', type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @ApiProperty({ example: '500.00', description: 'Amount in account currency' })
  @Column({ name: 'amount', type: 'numeric', precision: 18, scale: 2 })
  amount: number;

  @ApiProperty({ example: 'MXN' })
  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'MXN' })
  currency: string;

  @ApiProperty({ example: 'Payment for services', required: false })
  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @ApiProperty({ example: 'abc-123-ref', description: 'External reference (idempotency key)', required: false })
  @Index()
  @Column({ name: 'reference', type: 'varchar', length: 100, nullable: true })
  reference: string | null;

  @ApiProperty({ example: '0.00', description: 'Fee applied to this transaction' })
  @Column({ name: 'fee_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  feeAmount: number;

  @ApiProperty({ example: null, description: 'Balance after transaction (snapshot)' })
  @Column({ name: 'balance_after', type: 'numeric', precision: 18, scale: 2, nullable: true })
  balanceAfter: number | null;

  @ManyToOne(() => Account, (account) => account.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;
}
