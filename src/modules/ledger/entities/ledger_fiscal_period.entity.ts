import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { FiscalPeriodStatus } from './fiscal-period-status.enum';
import { FiscalPeriodType } from './fiscal-period-type.enum';

@Entity('ledger_fiscal_period')
export class LedgerFiscalPeriod extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  period_name: string;

  @Column({ type: 'int' })
  fiscal_year: number;

  @Column({ type: 'int' })
  period_number: number;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'enum', enum: FiscalPeriodType })
  period_type: FiscalPeriodType;

  @Column({
    type: 'enum',
    enum: FiscalPeriodStatus,
    default: FiscalPeriodStatus.OPEN,
  })
  status: FiscalPeriodStatus;

  @Column({ type: 'uuid', nullable: true })
  closed_by: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  closed_at: Date | null;

  @Column({ type: 'int', default: 0 })
  reopen_count: number;

  @Column({ type: 'boolean', default: false })
  adjusted: boolean;
}
