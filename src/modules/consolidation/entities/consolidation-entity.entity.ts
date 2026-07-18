import {
  Entity, Column, OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum OwnershipType {
  WHOLLY_OWNED = 'wholly_owned',
  MAJORITY = 'majority',
  JOINT_VENTURE = 'joint_venture',
  ASSOCIATE = 'associate',
}

@Entity('consolidation_entity')
export class ConsolidationEntity extends BaseEntity {
  @Column({ name: 'entity_code', type: 'varchar', length: 50, unique: true, nullable: false })
  entityCode: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 255, nullable: false })
  legalName: string;

  @Column({ name: 'country_code', type: 'varchar', length: 2, nullable: false })
  countryCode: string;

  @Column({ name: 'functional_currency', type: 'varchar', length: 3, nullable: false })
  functionalCurrency: string;

  @Column({ name: 'reporting_currency_group', type: 'varchar', length: 3, default: 'USD' })
  reportingCurrencyGroup: string;

  @Column({ name: 'ownership_percentage', type: 'numeric', precision: 5, scale: 2, default: 100 })
  ownershipPercentage: number;

  @Column({ name: 'ownership_type', type: 'varchar', length: 20, nullable: false })
  ownershipType: OwnershipType;

  @Column({ name: 'parent_entity_id', type: 'uuid', nullable: true })
  parentEntityId: string | null;

  @Column({ name: 'acquisition_date', type: 'date', nullable: true })
  acquisitionDate: Date | null;

  @Column({ name: 'acquisition_method', type: 'varchar', length: 50, nullable: true })
  acquisitionMethod: string | null;

  @Column({ name: 'goodwill_recognized', type: 'numeric', precision: 18, scale: 2, nullable: true })
  goodwillRecognized: number | null;

  @Column({ name: 'minority_interest_pct', type: 'numeric', precision: 5, scale: 2, default: 0 })
  minorityInterestPct: number;

  @Column({ name: 'intercompany_elimination_entity_id', type: 'uuid', nullable: true })
  intercompanyEliminationEntityId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'consolidation_level', type: 'integer', default: 1 })
  consolidationLevel: number;

  @Column({ name: 'tax_jurisdiction', type: 'varchar', length: 50, nullable: true })
  taxJurisdiction: string | null;

  @Column({ name: 'segment_classification', type: 'varchar', length: 50, nullable: true })
  segmentClassification: string | null;


}
