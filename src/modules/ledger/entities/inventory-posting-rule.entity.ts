import {
  Entity,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

@Entity('inventory_posting_rule')
export class InventoryPostingRule extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  companyProfileId: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  movementType: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  debitAccountType: string;

  @Column({ type: 'uuid', nullable: false })
  debitAccountId: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  creditAccountType: string;

  @Column({ type: 'uuid', nullable: false })
  creditAccountId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
