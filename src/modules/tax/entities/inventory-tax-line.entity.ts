import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { TaxCalculationResult } from './tax-calculation-result.entity';

@Entity('inventory_tax_line')
export class InventoryTaxLine extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  stockMovementId: string;

  @Column({ type: 'uuid', nullable: false })
  inventoryItemId: string;

  @Column({ type: 'uuid', nullable: true })
  taxCalculationResultId?: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  sku: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  itemName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxCategory?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  taxability?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  quantity: number;

  @Column({ type: 'numeric', precision: 18, scale: 6, nullable: false })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  taxableAmount: number;

  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: false })
  appliedRate: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  taxAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  totalAmount: number;

  @Column({ type: 'varchar', length: 3, nullable: false, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  jurisdictionCode?: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  isExempt: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  exemptionReason?: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  reverseCharge: boolean;

  @Column({ type: 'jsonb', nullable: true })
  breakdown?: any;

  @ManyToOne(() => TaxCalculationResult)
  @JoinColumn({ name: 'taxCalculationResultId' })
  taxCalculationResult?: TaxCalculationResult;
}
