// src/modules/loans/entities/loan-product.entity.ts

import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';
import { LoanType, InterestType } from './loans.enums.js';

@Entity('loan_product')
@Unique(['productCode'])
export class LoanProduct extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'product_code' })
  productCode: string;

  @Column({ type: 'varchar', length: 255, name: 'product_name' })
  productName: string;

  @Column({ type: 'varchar', length: 30, name: 'loan_type' })
  loanType: LoanType;

  @Column({ type: 'varchar', length: 20, name: 'interest_type' })
  interestType: InterestType;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'min_amount' })
  minAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'max_amount' })
  maxAmount: number;

  @Column({ type: 'int', name: 'min_term_months' })
  minTermMonths: number;

  @Column({ type: 'int', name: 'max_term_months' })
  maxTermMonths: number;

  @Column({ type: 'numeric', precision: 8, scale: 5, name: 'base_interest_rate' })
  baseInterestRate: number;

  @Column({ type: 'numeric', precision: 8, scale: 5, name: 'rate_floor', nullable: true })
  rateFloor: number | null;

  @Column({ type: 'numeric', precision: 8, scale: 5, name: 'rate_ceiling', nullable: true })
  rateCeiling: number | null;

  @Column({ type: 'numeric', precision: 8, scale: 5, name: 'apr_disclosed', nullable: true })
  aprDisclosed: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'origination_fee_pct', nullable: true })
  originationFeePct: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'origination_fee_flat', nullable: true })
  originationFeeFlat: number | null;

  @Column({ type: 'boolean', name: 'prepayment_penalty_enabled', default: false })
  prepaymentPenaltyEnabled: boolean;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'prepayment_penalty_pct', nullable: true })
  prepaymentPenaltyPct: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'late_fee_pct', nullable: true })
  lateFeePct: number | null;

  @Column({ type: 'int', name: 'late_fee_grace_days', default: 10 })
  lateFeeGraceDays: number;

  @Column({ type: 'boolean', name: 'collateral_required', default: false })
  collateralRequired: boolean;

  @Column({ type: 'varchar', length: 50, name: 'collateral_type', nullable: true })
  collateralType: string | null;

  @Column({ type: 'boolean', name: 'insurance_required', default: false })
  insuranceRequired: boolean;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'escrow_required_ltv_threshold', nullable: true })
  escrowRequiredLtvThreshold: number | null;

  @Column({ type: 'int', name: 'eligibility_min_credit_score', nullable: true })
  eligibilityMinCreditScore: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'eligibility_max_dti', nullable: true })
  eligibilityMaxDti: number | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;
}
