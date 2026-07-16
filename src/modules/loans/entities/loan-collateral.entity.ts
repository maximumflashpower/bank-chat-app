// src/modules/loans/entities/loan-collateral.entity.ts

import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';
import { CollateralType, TitleVerificationStatus, CollateralStatus, PropertyType } from './loans.enums.js';

@Entity('loan_collateral')
export class LoanCollateral extends BaseEntity {
  @Column({ type: 'uuid', name: 'loan_id' })
  loanId: string;

  @Column({ type: 'varchar', length: 30, name: 'collateral_type' })
  collateralType: CollateralType;

  @Column({ type: 'text', name: 'description' })
  description: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'assessed_value' })
  assessedValue: number;

  @Column({ type: 'date', name: 'assessment_date', nullable: true })
  assessmentDate: Date | null;

  @Column({ type: 'varchar', length: 255, name: 'appraiser_name', nullable: true })
  appraiserName: string | null;

  @Column({ type: 'text', name: 'appraisal_report_url', nullable: true })
  appraisalReportUrl: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'ltv_ratio', nullable: true })
  ltvRatio: number | null;

  @Column({ type: 'varchar', length: 20, name: 'title_verification_status', nullable: true })
  titleVerificationStatus: TitleVerificationStatus | null;

  @Column({ type: 'int', name: 'lien_position', default: 1 })
  lienPosition: number;

  @Column({ type: 'date', name: 'lien_recorded_at', nullable: true })
  lienRecordedAt: Date | null;

  @Column({ type: 'varchar', length: 100, name: 'insurance_policy_number', nullable: true })
  insurancePolicyNumber: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'insurance_coverage_amount', nullable: true })
  insuranceCoverageAmount: number | null;

  @Column({ type: 'date', name: 'insurance_expiry_date', nullable: true })
  insuranceExpiryDate: Date | null;

  @Column({ type: 'varchar', length: 50, name: 'vehicle_vin', nullable: true })
  vehicleVin: string | null;

  @Column({ type: 'text', name: 'property_address', nullable: true })
  propertyAddress: string | null;

  @Column({ type: 'varchar', length: 50, name: 'property_type', nullable: true })
  propertyType: PropertyType | null;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'registered' })
  status: CollateralStatus;

  @Column({ type: 'timestamptz', name: 'released_at', nullable: true })
  releasedAt: Date | null;
}
