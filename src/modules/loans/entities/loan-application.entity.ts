// src/modules/loans/entities/loan-application.entity.ts

import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';
import { EmploymentStatus, DecisionStatus } from './loans.enums.js';

@Entity('loan_application')
export class LoanApplication extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'application_number', unique: true })
  applicationNumber: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'uuid', name: 'loan_product_id' })
  loanProductId: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'requested_amount' })
  requestedAmount: number;

  @Column({ type: 'int', name: 'requested_term_months' })
  requestedTermMonths: number;

  @Column({ type: 'varchar', length: 100, name: 'loan_purpose', nullable: true })
  loanPurpose: string | null;

  @Column({ type: 'text', name: 'purpose_description', nullable: true })
  purposeDescription: string | null;

  @Column({ type: 'varchar', length: 50, name: 'employment_status', nullable: true })
  employmentStatus: EmploymentStatus | null;

  @Column({ type: 'varchar', length: 255, name: 'employer_name', nullable: true })
  employerName: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'annual_income_declared', nullable: true })
  annualIncomeDeclared: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'monthly_income_verified', nullable: true })
  monthlyIncomeVerified: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'monthly_debt_obligations', nullable: true })
  monthlyDebtObligations: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'dti_ratio_calculated', nullable: true })
  dtiRatioCalculated: number | null;

  @Column({ type: 'int', name: 'bureau_credit_score', nullable: true })
  bureauCreditScore: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'internal_score', nullable: true })
  internalScore: number | null;

  @Column({ type: 'numeric', precision: 8, scale: 5, name: 'pd_probability_default', nullable: true })
  pdProbabilityDefault: number | null;

  @Column({ type: 'numeric', precision: 8, scale: 5, name: 'lgd_loss_given_default', nullable: true })
  lgdLossGivenDefault: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'expected_loss', nullable: true })
  expectedLoss: number | null;

  @Column({ type: 'varchar', length: 10, name: 'credit_rating_assigned', nullable: true })
  creditRatingAssigned: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'approved_amount', nullable: true })
  approvedAmount: number | null;

  @Column({ type: 'numeric', precision: 8, scale: 5, name: 'approved_rate', nullable: true })
  approvedRate: number | null;

  @Column({ type: 'int', name: 'approved_term_months', nullable: true })
  approvedTermMonths: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'approved_monthly_payment', nullable: true })
  approvedMonthlyPayment: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'counteroffer_amount', nullable: true })
  counterofferAmount: number | null;

  @Column({ type: 'numeric', precision: 8, scale: 5, name: 'counteroffer_rate', nullable: true })
  counterofferRate: number | null;

  @Column({ type: 'varchar', length: 20, name: 'decision_status', default: 'pending' })
  decisionStatus: DecisionStatus;

  @Column({ type: 'text', name: 'decision_reason', nullable: true })
  decisionReason: string | null;

  @Column({ type: 'jsonb', name: 'decision_factors_json', nullable: true })
  decisionFactorsJson: Record<string, any> | null;

  @Column({ type: 'uuid', name: 'underwriter_id', nullable: true })
  underwriterId: string | null;

  @Column({ type: 'boolean', name: 'committee_approval_required', default: false })
  committeeApprovalRequired: boolean;

  @Column({ type: 'timestamptz', name: 'committee_approved_at', nullable: true })
  committeeApprovedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'e_signed_at', nullable: true })
  eSignedAt: Date | null;

  @Column({ type: 'text', name: 'e_signature_ref', nullable: true })
  eSignatureRef: string | null;

  @Column({ type: 'timestamptz', name: 'submitted_at', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'decided_at', nullable: true })
  decidedAt: Date | null;
}
