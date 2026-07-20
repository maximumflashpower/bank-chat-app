import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum NightDepositType {
  BUSINESS_BAG = 'business_bag',
  LOCKED_BAG = 'locked_bag',
  ENVELOPE = 'envelope',
  SMART_SAFE = 'smart_safe',
}

export enum NightDepositStatus {
  RECEIVED = 'received',
  OPENED = 'opened',
  PROCESSED = 'processed',
  DISCREPANCY = 'discrepancy',
  REJECTED = 'rejected',
}

@Entity('teller_night_deposit')
@Index(['depositReference'])
@Index(['branchId'])
@Index(['customerId'])
export class TellerNightDeposit extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'deposit_reference' })
  depositReference: string;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'uuid', nullable: true, name: 'account_id' })
  accountId?: string;

  @Column({ type: 'varchar', length: 30, name: 'deposit_type' })
  depositType: NightDepositType;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'bag_identifier' })
  bagIdentifier?: string;

  @Column({ type: 'timestamptz', name: 'deposited_at' })
  depositedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'received_by_user_id' })
  receivedByUserId?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'processed_at' })
  processedAt?: Date;

  @Column({ type: 'uuid', nullable: true, name: 'processed_by_user_id' })
  processedByUserId?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'stated_cash_amount' })
  statedCashAmount?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'counted_cash_amount' })
  countedCashAmount?: number;

  @Column({ type: 'int', nullable: true, name: 'stated_check_count' })
  statedCheckCount?: number;

  @Column({ type: 'int', nullable: true, name: 'counted_check_count' })
  countedCheckCount?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'stated_check_total' })
  statedCheckTotal?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'counted_check_total' })
  countedCheckTotal?: number;

  @Column({ type: 'jsonb', nullable: true, name: 'denomination_breakdown' })
  denominationBreakdown?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true, name: 'check_details' })
  checkDetails?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 3, default: 'USD', name: 'currency_code' })
  currencyCode: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'variance_amount' })
  varianceAmount?: number;

  @Column({ type: 'varchar', length: 20, default: NightDepositStatus.RECEIVED, name: 'deposit_status' })
  depositStatus: NightDepositStatus;

  @Column({ type: 'text', nullable: true, name: 'discrepancy_notes' })
  discrepancyNotes?: string;

  @Column({ type: 'uuid', nullable: true, name: 'ledger_journal_entry_id' })
  ledgerJournalEntryId?: string;

  @Column({ type: 'text', nullable: true, name: 'images' })
  images?: string;
}
