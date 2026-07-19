import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum ClaimStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CLOSED = 'closed',
}

@Entity('insurance_claims')
export class InsuranceClaim extends BaseEntity {
  @Column({ name: 'claim_number', type: 'varchar', length: 50, nullable: false })
  claimNumber: string;

  @Column({ name: 'policy_id', type: 'uuid', nullable: false })
  policyId: string;

  @Column({ name: 'claim_type', type: 'varchar', length: 50, nullable: false })
  claimType: string;

  @Column({ name: 'incident_date', type: 'timestamp', nullable: false })
  incidentDate: Date;

  @Column({ name: 'incident_location', type: 'varchar', length: 200, nullable: true })
  incidentLocation: string | null;

  @Column({ name: 'description', type: 'text', nullable: false })
  description: string;

  @Column({ name: 'claimed_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  claimedAmount: number;

  @Column({ name: 'approved_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  approvedAmount: number | null;

  @Column({ name: 'currency', type: 'varchar', length: 3, nullable: false })
  currency: string;

  @Column({ type: 'varchar', length: 20, default: ClaimStatus.SUBMITTED })
  status: ClaimStatus;

  @Column({ name: 'assigned_adjuster', type: 'uuid', nullable: true })
  assignedAdjuster: string | null;

  @Column({ name: 'payout_date', type: 'date', nullable: true })
  payoutDate: Date | null;

  @Column({ name: 'payout_reference', type: 'varchar', length: 100, nullable: true })
  payoutReference: string | null;

  @Column({ name: 'ledger_entry_id', type: 'uuid', nullable: true })
  ledgerEntryId: string | null;
}
