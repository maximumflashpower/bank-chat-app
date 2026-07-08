import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { SmbInventoryItem } from './smb-inventory-item.entity';
import { SmbWarehouse } from './smb-warehouse.entity';

@Entity('smb_stock_level')
@Unique(['itemId', 'warehouseId'])
export class SmbStockLevel extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  itemId: string;

  @Column({ type: 'uuid', nullable: false })
  warehouseId: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false, default: 0 })
  onHand: number;

  @Column({ type: 'numeric', precision:  18, scale: 2, nullable: false, default: 0 })
  committed: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false, default: 0 })
  incoming: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false, default: 0 })
  available: number;

  @Column({ type: 'numeric', precision: 18, scale: 6, nullable: true, default: 0 })
  movingAvgCost: number;

  @Column({ type: 'numeric', precision: 18, scale: 6, nullable: true, default: 0 })
  lastCost: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, default: 0 })
  totalValue: number;

  @Column({ type: 'date', nullable: true })
  lastMovementDate?: Date;

  @ManyToOne(() => SmbInventoryItem)
  @JoinColumn({ name: 'itemId' })
  item?: SmbInventoryItem;

  @ManyToOne(() => SmbWarehouse)
  @JoinColumn({ name: 'warehouseId' })
  warehouse?: SmbWarehouse;
}
