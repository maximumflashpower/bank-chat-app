import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum RestructureStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EFFECTIVE = 'effective',
  CANCELLED = 'cancelled',
}

@Entity('loan_restructures')
@Index(['loanId'])
export class LoanRestructure extends BaseEntity {
  @Column({ type: 'uuid', name: 'loan_id' })
  loanId: string;

  @Column({ type: 'varchar', length: 100 })
  reason: string;

  @Column({ type: 'integer', nullable: true, name: 'old_term' })
  oldTerm?: number;

  @Column({ type: 'integer', nullable: true, name: 'new_term' })
  newTerm?: number;

  @Column({ type: 'numeric', precision: 8, scale: 4, nullable: true, name: 'old_rate' })
  oldRate?: number;

  @Column({ type: 'numeric', precision: 8, scale: 4, nullable: true, name: 'new_rate' })
  newRate?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'old_payment' })
  oldPayment?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'new_payment' })
  newPayment?: number;

  @Column({ type: 'uuid', nullable: true, name: 'approved_by' })
  approvedBy?: string;

  @Column({ type: 'varchar', length: 20, default: RestructureStatus.PENDING })
  status: RestructureStatus;

  @Column({ type: 'date', nullable: true, name: 'effective_date' })
  effectiveDate?: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'approval_conditions' })
  approvalConditions?: Record<string, any>;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'decided_at' })
  decidedAt?: Date;
}
