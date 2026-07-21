import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum AcquisitionStatus {
  ANNOUNCED = 'announced',
  REGULATORY_APPROVAL = 'regulatory_approval',
  CLOSING = 'closing',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
  IMPAIRMENT_TESTING = 'impairment_testing',
}

@Entity('consolidation_acquisition_register')
export class ConsolidationAcquisitionRegister extends BaseEntity {
  @Column({ name: 'acquisition_code', type: 'varchar', length: 50, unique: true, nullable: false })
  acquisitionCode: string;

  @Column({ name: 'acquiring_entity_id', type: 'uuid', nullable: false })
  acquiringEntityId: string;

  @Column({ name: 'target_company_name', type: 'varchar', length: 255, nullable: false })
  targetCompanyName: string;

  @Column({ name: 'target_country', type: 'varchar', length: 2, nullable: false })
  targetCountry: string;

  @Column({ type: 'varchar', length: 20, default: 'announced' })
  status: AcquisitionStatus;

  @Column({ name: 'transaction_value', type: 'numeric', precision: 18, scale: 2, nullable: false })
  transactionValue: number;

  @Column({ name: 'transaction_currency', type: 'varchar', length: 3, default: 'USD' })
  transactionCurrency: string;

  @Column({ name: 'ownership_acquired_pct', type: 'numeric', precision: 5, scale: 2, nullable: false })
  ownershipAcquiredPct: number;

  @Column({ name: 'fair_value_identifiable_assets', type: 'numeric', precision: 18, scale: 2, nullable: true })
  fairValueIdentifiableAssets: number | null;

  @Column({ name: 'fair_value_identifiable_liabilities', type: 'numeric', precision: 18, scale: 2, nullable: true })
  fairValueIdentifiableLiabilities: number | null;

  @Column({ name: 'goodwill_calculated', type: 'numeric', precision: 18, scale: 2, nullable: true })
  goodwillCalculated: number | null;

  @Column({ name: 'goodwill_impairment', type: 'numeric', precision: 18, scale: 2, default: 0 })
  goodwillImpairment: number;

  @Column({ name: 'non_controlling_interest', type: 'numeric', precision: 18, scale: 2, default: 0 })
  nonControllingInterest: number;

  @Column({ name: 'purchase_price_allocation_date', type: 'date', nullable: true })
  purchasePriceAllocationDate: Date | null;

  @Column({ name: 'integration_status', type: 'varchar', length: 50, nullable: true })
  integrationStatus: string | null;

  @Column({ name: 'synergies_realized', type: 'numeric', precision: 18, scale: 2, default: 0 })
  synergiesRealized: number;
}
