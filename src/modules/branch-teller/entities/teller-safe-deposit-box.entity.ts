import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum SafeDepositBoxSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large',
}

export enum SafeDepositBoxStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
  DISABLED = 'disabled',
}

@Entity('teller_safe_deposit_box')
@Index(['boxNumber'])
@Index(['branchId'])
@Index(['customerId'])
export class TellerSafeDepositBox extends BaseEntity {
  @Column({ type: 'varchar', length: 30, unique: true, name: 'box_number' })
  boxNumber: string;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId: string;

  @Column({ type: 'varchar', length: 20, name: 'box_size' })
  boxSize: SafeDepositBoxSize;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'vault_location' })
  vaultLocation?: string;

  @Column({ type: 'varchar', length: 20, default: SafeDepositBoxStatus.AVAILABLE, name: 'box_status' })
  boxStatus: SafeDepositBoxStatus;

  @Column({ type: 'uuid', nullable: true, name: 'customer_id' })
  customerId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'joint_renter_id' })
  jointRenterId?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'annual_rental_fee' })
  annualRentalFee: number;

  @Column({ type: 'varchar', length: 3, default: 'USD', name: 'currency_code' })
  currencyCode: string;

  @Column({ type: 'date', nullable: true, name: 'rental_start_date' })
  rentalStartDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'rental_end_date' })
  rentalEndDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'next_billing_date' })
  nextBillingDate?: Date;

  @Column({ type: 'boolean', default: false, name: 'auto_renew' })
  autoRenew: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'billing_account_id' })
  billingAccountId?: string;

  @Column({ type: 'int', default: 2, name: 'required_keys_count' })
  requiredKeysCount: number;

  @Column({ type: 'boolean', default: true, name: 'dual_control_required' })
  dualControlRequired: boolean;

  @Column({ type: 'text', array: true, nullable: true, name: 'authorized_signatories' })
  authorizedSignatories?: string[];

  @Column({ type: 'timestamptz', nullable: true, name: 'last_accessed_at' })
  lastAccessedAt?: Date;

  @Column({ type: 'uuid', nullable: true, name: 'last_accessed_by_user_id' })
  lastAccessedByUserId?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_accessed_by_customer_id' })
  lastAccessedByCustomerId?: string;

  @Column({ type: 'int', default: 0, name: 'total_access_count' })
  totalAccessCount: number;

  @Column({ type: 'boolean', default: false, name: 'overdue_payment' })
  overduePayment: boolean;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'overdue_amount' })
  overdueAmount?: number;

  @Column({ type: 'text', nullable: true, name: 'notes' })
  notes?: string;
}
