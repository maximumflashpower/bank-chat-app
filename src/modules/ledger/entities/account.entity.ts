import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';
import { AccountType } from './account-type.enum';
import { AccountStatus } from './account-status.enum';
import { Transaction } from './transaction.entity';

@Entity({ name: 'accounts' })
export class Account extends BaseEntity {
  @ApiProperty({ type: String, description: 'UUID of the owner user' })
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'MXN-checking-001', description: 'Human-readable account alias' })
  @Column({ name: 'alias', type: 'varchar', length: 100, nullable: true })
  alias: string | null;

  @ApiProperty({ example: '000123456789', description: 'Unique account number' })
  @Index({ unique: true })
  @Column({ name: 'account_number', type: 'varchar', length: 20, unique: true })
  accountNumber: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CHECKING })
  @Column({ name: 'type', type: 'enum', enum: AccountType })
  type: AccountType;

  @ApiProperty({ enum: AccountStatus, example: AccountStatus.ACTIVE })
  @Column({ name: 'status', type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
  status: AccountStatus;

  @ApiProperty({ example: '1000.00', description: 'Available balance (numeric, 2 decimals)' })
  @Column({ name: 'balance', type: 'numeric', precision: 18, scale: 2, default: 0 })
  balance: number;

  @ApiProperty({ example: 'MXN' })
  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'MXN' })
  currency: string;

  @ApiProperty({ example: '5000.00', description: 'Daily transfer limit' })
  @Column({ name: 'daily_limit', type: 'numeric', precision: 18, scale: 2, default: 5000 })
  dailyLimit: number;

  @ApiProperty({ example: false, description: 'Minimum balance enforcement flag' })
  @Column({ name: 'min_balance', type: 'numeric', precision: 18, scale: 2, default: 0 })
  minBalance: number;

  @ApiProperty({ type: () => [Transaction] })
  @OneToMany(() => Transaction, (tx) => tx.account, { cascade: false })
  transactions: Transaction[];

  @ManyToOne(() => IdentityUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;
}
