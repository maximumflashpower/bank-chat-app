import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum EndorsementType {
  COVERAGE_CHANGE = 'coverage_change',
  DATA_UPDATE = 'data_update',
  BENEFICIARY_CHANGE = 'beneficiary_change',
  ADDRESS_CHANGE = 'address_change',
  VEHICLE_CHANGE = 'vehicle_change',
  SUM_INSURED_ADJUSTMENT = 'sum_insured_adjustment',
}

export enum EndorsementStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EFFECTIVE = 'effective',
}

@Entity('policy_endorsements')
export class PolicyEndorsement extends BaseEntity {
  @Column({ name: 'policy_id', type: 'uuid', nullable: false })
  policyId: string;

  @Column({ name: 'endorsement_type', type: 'varchar', length: 30, nullable: false })
  endorsementType: EndorsementType;

  @Column({ name: 'changes', type: 'jsonb', nullable: false })
  changes: Record<string, any>;

  @Column({ name: 'premium_adjustment', type: 'numeric', precision: 18, scale: 2, default: 0 })
  premiumAdjustment: number;

  @Column({ type: 'varchar', length: 20, default: EndorsementStatus.PENDING })
  status: EndorsementStatus;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'effective_date', type: 'date', nullable: false })
  effectiveDate: Date;
}
