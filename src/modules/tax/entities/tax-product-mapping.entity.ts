import {
  Entity,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

@Entity('tax_product_mapping')
export class TaxProductMapping extends BaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: false })
  productSku: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  productName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  hsTariffCode?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vatProductCode?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxCategory?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  defaultTaxability?: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  reverseChargeApplicable: boolean;

  @Column({ type: 'text', array: true, nullable: true })
  countryCodes?: string[];

  @Column({ type: 'date', nullable: false })
  effectiveFrom: Date;

  @Column({ type: 'date', nullable: true })
  effectiveTo?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
