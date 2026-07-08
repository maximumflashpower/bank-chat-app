import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { SmbCompanyProfile } from '../../smb/entities/smb-company-profile.entity';

@Entity('smb_inventory_item')
export class SmbInventoryItem extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  companyProfileId: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  sku: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  barcode?: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  itemName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  subcategory?: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  unitOfMeasure: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'WEIGHTED_AVG' })
  valuationMethod: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  standardCost?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  sellingPrice?: number;

  @Column({ type: 'varchar', length: 3, nullable: false, default: 'USD' })
  currency: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  reorderLevel?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  reorderQuantity?: number;

  @Column({ type: 'int', nullable: true })
  leadTimeDays?: number;

  @Column({ type: 'boolean', nullable: false, default: false })
  isPerishable: boolean;

  @Column({ type: 'int', nullable: true })
  shelfLifeDays?: number;

  @Column({ type: 'boolean', nullable: false, default: false })
  serialTrackingEnabled: boolean;

  @Column({ type: 'boolean', nullable: false, default: false })
  lotTrackingEnabled: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  abcClassification?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  hsTariffCode?: string;

  @ManyToOne(() => SmbCompanyProfile)
  @JoinColumn({ name: 'companyProfileId' })
  companyProfile?: SmbCompanyProfile;
}
