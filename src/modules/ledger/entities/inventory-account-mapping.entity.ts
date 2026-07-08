import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { LedgerChartOfAccounts } from './ledger_chart_of_accounts.entity';

@Entity('inventory_account_mapping')
export class InventoryAccountMapping extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  companyProfileId: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  category: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  movementType: string;

  @Column({ type: 'uuid', nullable: false })
  accountId: string;

  @ManyToOne(() => LedgerChartOfAccounts)
  @JoinColumn({ name: 'accountId' })
  account?: LedgerChartOfAccounts;
}
