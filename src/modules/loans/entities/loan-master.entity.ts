// src/modules/loans/entities/loan-master.entity.ts

import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';
import { LoanType, InterestType, LoanStatus, DelinquencyStatus, ArmAdjustmentFrequency } from './loans.enums.js';

@Entity('loan_master')
export class LoanMaster extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'loan_number', unique: true })
  loanNumber: string;

  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'uuid', name: 'loan_product_id' })
  loanProductId: string;

  @Column({ type: 'varchar', length: 30, name: 'loan_type' })
  loanType: LoanType;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'principal_amount' })
  principalAmount: number;

  @Column({ type: 'numeric', precision: 8, scale: 5, name: 'interest_rate' })
  interestRate: number;

  @Column({ type: 'numeric', precision: 8, scale: 5, name: 'apr' })
  apr: number;

  @Column({ type: 'int', name: 'term_months' })
  termMonths: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'monthly_payment_amount' })
  monthlyPaymentAmount: number;

  @Column({ type: 'int', name: 'payment_due_day' })
  paymentDueDay: number;

  @Column({ type: 'date', name: 'disbursement_date' })
  disbursementDate: Date;

  @Column({ type: 'date', name: 'first_payment_date' })
  firstPaymentDate: Date;

  @Column({ type: 'date', name: 'maturity_date' })
  maturityDate: Date;

  @Column({ type: 'varchar', length: 20, name: 'interest_type' })
  interestType: InterestType;

  @Column({ type: 'varchar', length: 50, name: 'arm_index_name', nullable: true })
  armIndexName: string | null;

  @Column({ type: 'numeric', precision: 8, scale: 5, name: 'arm_margin', nullable: true })
  armMargin: number | null;

  @Column({ type: 'varchar', length: 20, name: 'arm_adjustment_frequency', nullable: true })
  armAdjustmentFrequency: ArmAdjustmentFrequency | null;

  @Column({ type: 'numeric', precision: 8, scale: 5, name: 'current_interest_rate', nullable: true })
  currentInterestRate: number | null;

  @Column({ type: 'date', name: 'next_rate_adjustment_date', nullable: true })
  nextRateAdjustmentDate: Date | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'original_balance' })
  originalBalance: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'current_principal_balance', nullable: true })
  currentPrincipalBalance: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'total_interest_paid', default: 0 })
  totalInterestPaid: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'total_principal_paid', default: 0 })
  totalPrincipalPaid: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'payoff_amount_current', nullable: true })
  payoffAmountCurrent: number | null;

  @Column({ type: 'date', name: 'next_payment_due_date', nullable: true })
  nextPaymentDueDate: Date | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'next_payment_amount', nullable: true })
  nextPaymentAmount: number | null;

  @Column({ type: 'int', name: 'days_past_due', default: 0 })
  daysPastDue: number;

  @Column({ type: 'varchar', length: 20, name: 'delinquency_status', default: 'current' })
  delinquencyStatus: DelinquencyStatus;

  @Column({ type: 'boolean', name: 'auto_debit_enabled', default: false })
  autoDebitEnabled: boolean;

  @Column({ type: 'uuid', name: 'auto_debit_account_id', nullable: true })
  autoDebitAccountId: string | null;

  @Column({ type: 'uuid', name: 'escrow_account_id', nullable: true })
  escrowAccountId: string | null;

  @Column({ type: 'boolean', name: 'pmi_required', default: false })
  pmiRequired: boolean;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'pmi_monthly_amount', nullable: true })
  pmiMonthlyAmount: number | null;

  @Column({ type: 'uuid', name: 'collateral_id', nullable: true })
  collateralId: string | null;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'active' })
  status: LoanStatus;

  @Column({ type: 'timestamptz', name: 'closed_at', nullable: true })
  closedAt: Date | null;
}
