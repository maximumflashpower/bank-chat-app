import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum DrawerShiftStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  SUSPENDED = 'suspended',
}

export enum VarianceType {
  SURPLUS = 'surplus',
  SHORTAGE = 'shortage',
  BALANCED = 'balanced',
}

@Entity('teller_cash_drawer')
@Index(['drawerNumber'])
@Index(['branchId'])
export class TellerCashDrawer extends BaseEntity {
  @Column({ type: 'varchar', length: 20, name: 'drawer_number' })
  @Index()
  drawerNumber: string;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId: string;

  @Column({ type: 'uuid', nullable: true, name: 'teller_user_id' })
  tellerUserId?: string;

  @Column({ type: 'varchar', length: 20, default: 'closed', name: 'shift_status' })
  shiftStatus: DrawerShiftStatus;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'opening_balance_total' })
  openingBalanceTotal: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'current_balance_total' })
  currentBalanceTotal?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'closing_balance_total' })
  closingBalanceTotal?: number;

  @Column({ type: 'jsonb', nullable: true, name: 'denomination_breakdown_open' })
  denominationBreakdownOpen?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true, name: 'denomination_breakdown_current' })
  denominationBreakdownCurrent?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true, name: 'denomination_breakdown_close' })
  denominationBreakdownClose?: Record<string, unknown>;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'max_cash_limit' })
  maxCashLimit?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'variance_amount' })
  varianceAmount?: number;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'variance_type' })
  varianceType?: VarianceType;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'variance_threshold_amount' })
  varianceThresholdAmount?: number;

  @Column({ type: 'uuid', nullable: true, name: 'override_approved_by' })
  overrideApprovedBy?: string;

  @Column({ type: 'int', default: 0, name: 'total_transactions_count' })
  totalTransactionsCount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'total_deposits_amount' })
  totalDepositsAmount?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'total_withdrawals_amount' })
  totalWithdrawalsAmount?: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'opened_at' })
  openedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'closed_at' })
  closedAt?: Date;
}
