import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum InsuranceProductType {
  LIFE = 'life',
  AUTO = 'auto',
  HOME = 'home',
  HEALTH = 'health',
  TRAVEL = 'travel',
}

@Entity('insurance_products')
export class InsuranceProduct extends BaseEntity {
  @Column({ name: 'product_code', type: 'varchar', length: 50, nullable: false })
  productCode: string;

  @Column({ name: 'product_name', type: 'varchar', length: 200, nullable: false })
  productName: string;

  @Column({ name: 'product_type', type: 'varchar', length: 30, nullable: false })
  productType: InsuranceProductType;

  @Column({ name: 'coverage_levels', type: 'jsonb', nullable: false })
  coverageLevels: Record<string, any>;

  @Column({ name: 'base_premium', type: 'numeric', precision: 18, scale: 2 })
  basePremium: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'min_term_months', type: 'integer', nullable: true })
  minTermMonths: number | null;

  @Column({ name: 'max_term_months', type: 'integer', nullable: true })
  maxTermMonths: number | null;

  @Column({ name: 'requires_underwriting', type: 'boolean', default: true })
  requiresUnderwriting: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
