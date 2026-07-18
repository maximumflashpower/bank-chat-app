import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

@Entity('retail_overdraft_event')
export class RetailOverdraftEvent extends BaseEntity {
  @Column({ name: 'account_id', type: 'uuid', nullable: false })
  accountId: string;

  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  transactionId: string | null;

  @Column({ name: 'transaction_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  transactionAmount: number;

  @Column({ name: 'balance_before', type: 'numeric', precision: 18, scale: 2, nullable: true })
  balanceBefore: number | null;

  @Column({ name: 'balance_after', type: 'numeric', precision: 18, scale: 2, nullable: true })
  balanceAfter: number | null;

  @Column({ name: 'overdraft_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  overdraftAmount: number;

  @Column({ name: 'overdraft_fee_charged', type: 'numeric', precision: 18, scale: 2, nullable: true })
  overdraftFeeCharged: number | null;

  @Column({ name: 'protection_used', type: 'boolean', nullable: false })
  protectionUsed: boolean;

  @Column({ name: 'protection_remaining', type: 'numeric', precision: 18, scale: 2, nullable: true })
  protectionRemaining: number | null;

  @Column({ name: 'nsf_returned', type: 'boolean', default: false })
  nsfReturned: boolean;

  @Column({ name: 'nsf_fee_charged', type: 'numeric', precision: 18, scale: 2, nullable: true })
  nsfFeeCharged: number | null;

  @Column({ name: 'notification_sent', type: 'boolean', default: false })
  notificationSent: boolean;

  @Column({ name: 'notification_channels', type: 'simple-array', nullable: true })
  notificationChannels: string[] | null;

  @Column({ name: 'event_timestamp', type: 'timestamptz', nullable: true })
  eventTimestamp: Date | null;
}
