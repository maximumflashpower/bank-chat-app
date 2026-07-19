import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum KycScreeningStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

export enum PepStatus {
  PEP = 'pep',
  NOT_PEP = 'not_pep',
  PEP_ASSOCIATE = 'pep_associate',
}

export enum SanctionsScreeningStatus {
  CLEAR = 'clear',
  MATCH = 'match',
  REVIEW = 'review',
}

@Entity('business_ubo_registration')
export class BusinessUboRegistration extends BaseEntity {
  @Column({ name: 'organization_id', type: 'uuid', nullable: false })
  organizationId: string;

  @Column({ name: 'ubo_user_id', type: 'uuid', nullable: true })
  uboUserId: string | null;

  @Column({ name: 'ubo_full_name', type: 'varchar', length: 255, nullable: false })
  uboFullName: string;

  @Column({ name: 'ownership_percentage', type: 'numeric', precision: 5, scale: 2, nullable: false })
  ownershipPercentage: number;

  @Column({ name: 'ownership_threshold_met', type: 'boolean', nullable: false })
  ownershipThresholdMet: boolean;

  @Column({ name: 'role_in_company', type: 'varchar', length: 100, nullable: true })
  roleInCompany: string | null;

  @Column({ name: 'kyc_screening_status', type: 'varchar', length: 20, nullable: false })
  kycScreeningStatus: KycScreeningStatus;

  @Column({ name: 'pep_status', type: 'varchar', length: 20, default: 'not_pep' })
  pepStatus: PepStatus;

  @Column({ name: 'sanctions_screening_status', type: 'varchar', length: 20, default: 'clear' })
  sanctionsScreeningStatus: SanctionsScreeningStatus;

  @Column({ name: 'adverse_media_flag', type: 'boolean', default: false })
  adverseMediaFlag: boolean;

  @Column({ name: 'source_of_wealth_desc', type: 'text', nullable: true })
  sourceOfWealthDesc: string | null;

  @Column({ name: 'registered_by', type: 'uuid', nullable: true })
  registeredBy: string | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;
}
