import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { SmbInventoryItem } from './smb-inventory-item.entity';
import { SmbWarehouse } from './smb-warehouse.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('smb_stock_movement')
export class SmbStockMovement extends BaseEntity {
  @Column({ type: 'varchar', length: 30, nullable: false })
  movementType: string;

  @Column({ type: 'uuid', nullable: false })
  itemId: string;

  @Column({ type: 'uuid', nullable: false })
  warehouseId: string;

  @Column({ type: 'uuid', nullable: true })
  toWarehouseId?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  quantity: number;

  @Column({ type: 'numeric', precision: 18, scale: 6, nullable: true })
  unitCost?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalCost?: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reference?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lotNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serialNumber?: string;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  journalEntryId?: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @ManyToOne(() => SmbInventoryItem)
  @JoinColumn({ name: 'itemId' })
  item?: SmbInventoryItem;

  @ManyToOne(() => SmbWarehouse)
  @JoinColumn({ name: 'warehouseId' })
  warehouse?: SmbWarehouse;

  @ManyToOne(() => SmbWarehouse)
  @JoinColumn({ name: 'toWarehouseId' })
  toWarehouse?: SmbWarehouse;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'createdBy' })
  createdByUser?: IdentityUser;
}
