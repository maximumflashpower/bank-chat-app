import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum FXRateSourceType {
  ECB = 'ecb',
  REUTERS = 'reuters',
  BLOOMBERG = 'bloomberg',
  MANUAL = 'manual',
  API = 'api',
}

@Entity('ledger_exchange_rates')
export class LedgerExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'from_currency', type: 'varchar', length: 3 })
  fromCurrency: string;

  @Index()
  @Column({ name: 'to_currency', type: 'varchar', length: 3 })
  toCurrency: string;

  @Column({ name: 'rate_buy', type: 'numeric', precision: 18, scale: 6 })
  rateBuy: number;

  @Column({ name: 'rate_sell', type: 'numeric', precision: 18, scale: 6, nullable: true })
  rateSell: number | null;

  @Column({ name: 'rate_avg', type: 'numeric', precision: 18, scale: 6 })
  rateAvg: number;

  @Column({ name: 'rate_date', type: 'date', nullable: false })
  rateDate: Date;

  @Column({ name: 'source_type', type: 'varchar', length: 20, default: 'ecb' })
  sourceType: FXRateSourceType;

  @Column({ name: 'source_reference', type: 'varchar', length: 100, nullable: true })
  sourceReference: string | null;

  @Column({ name: 'effective', type: 'boolean', default: true })
  effective: boolean;

  @Column({ name: 'revalued_at', type: 'timestamptz', nullable: true })
  revaluedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
