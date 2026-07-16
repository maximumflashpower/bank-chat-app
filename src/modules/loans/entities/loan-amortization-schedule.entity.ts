// src/modules/loans/entities/loan-amortization-schedule.entity.ts

import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';
import { PaymentStatus } from './loans.enums.js';

@Entity('loan_amortization_schedule')
export class LoanAmortizationSchedule extends BaseEntity {
  @Column({ type: 'uuid', name: 'loan_id' })
  loanId: string;

  @Column({ type: 'int', name: 'installment_number' })
  installmentNumber: number;

  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'beginning_balance' })
  beginningBalance: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'scheduled_payment' })
  scheduledPayment: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'principal_component' })
  principalComponent: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'interest_component' })
  interestComponent: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'escrow_component', nullable: true })
  escrowComponent: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'pmi_component', nullable: true })
  pmiComponent: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'ending_balance' })
  endingBalance: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'actual_payment_received', default: 0 })
  actualPaymentReceived: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'actual_principal_applied', default: 0 })
  actualPrincipalApplied: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'actual_interest_applied', default: 0 })
  actualInterestApplied: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'late_fee_assessed', default: 0 })
  lateFeeAssessed: number;

  @Column({ type: 'varchar', length: 20, name: 'payment_status', default: 'scheduled' })
  paymentStatus: PaymentStatus;

  @Column({ type: 'date', name: 'paid_date', nullable: true })
  paidDate: Date | null;

  @Column({ type: 'int', name: 'days_late', default: 0 })
  daysLate: number;

  @Column({ type: 'boolean', name: 'is_extra_payment', default: false })
  isExtraPayment: boolean;

  @Column({ type: 'boolean', name: 'recalculated_after_extra', default: false })
  recalculatedAfterExtra: boolean;
}
