import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum PremiumStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  WAIVED = 'waived',
}

@Entity('premium_schedules')
export class PremiumSchedule extends BaseEntity {
  @Column({ name: 'policy_id', type: 'uuid', nullable: false })
  policyId: string;

  @Column({ name: 'installment_number', type: 'integer', nullable: false })
  installmentNumber: number;

  @Column({ name: 'due_date', type: 'date', nullable: false })
  dueDate: Date;

  @Column({ name: 'premium_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  premiumAmount: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, nullable: false })
  currency: string;

  @Column({ type: 'varchar', length: 20, default: PremiumStatus.PENDING })
  status: PremiumStatus;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId: string | null;

  @Column({ name: 'ledger_entry_id', type: 'uuid', nullable: true })
  ledgerEntryId: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;
}
