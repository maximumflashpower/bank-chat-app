import {
  Entity,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

@Entity('tax_jurisdiction_rule')
export class TaxJurisdictionRule extends BaseEntity {
  @Column({ type: 'varchar', length: 2, nullable: false })
  countryCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  regionState?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cityMunicipality?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  zipPostalCode?: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  ruleType: string;

  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: false, default: 0 })
  rateStandard: number;

  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: false, default: 0 })
  rateReduced: number;

  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: false, default: 0 })
  rateSuperReduced: number;

  @Column({ type: 'date', nullable: false })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  expirationDate?: Date;

  @Column({ type: 'text', nullable: true })
  sourceLawReference?: string;

  @Column({ type: 'boolean', nullable: false, default: true })
  active: boolean;
}
