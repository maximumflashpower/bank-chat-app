import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { GlAccountType } from './gl-account-type.enum';
import { NormalBalance } from './normal-balance.enum';
import { ChartAccountStatus } from './chart-account-status.enum';

@Entity('ledger_chart_of_accounts')
export class LedgerChartOfAccounts extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  account_code: string;

  @Column({ type: 'varchar', length: 255 })
  account_name: string;

  @Column({ type: 'enum', enum: GlAccountType })
  account_type: GlAccountType;

  @ManyToOne(() => LedgerChartOfAccounts, { nullable: true })
  @JoinColumn({ name: 'parent_account_id' })
  parent_account: LedgerChartOfAccounts;

  @Column({ type: 'uuid', nullable: true })
  parent_account_id: string | null;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'boolean', default: true })
  is_postable: boolean;

  @Column({ type: 'boolean', default: false })
  is_control_account: boolean;

  @Column({ type: 'enum', enum: NormalBalance })
  normal_balance: NormalBalance;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ChartAccountStatus,
    default: ChartAccountStatus.ACTIVE,
  })
  status: ChartAccountStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  xbrl_tag: string | null;
}
