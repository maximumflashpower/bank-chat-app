import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum TranslationMethod {
  CURRENT_RATE = 'current_rate',
  AVERAGE_RATE = 'average_rate',
  HISTORICAL_RATE = 'historical_rate',
  TEMPORAL = 'temporal',
}

export enum TranslationType {
  BALANCE_SHEET = 'balance_sheet',
  INCOME_STATEMENT = 'income_statement',
  CASH_FLOW = 'cash_flow',
  EQUITY = 'equity',
}

@Entity('consolidation_currency_translation')
export class ConsolidationCurrencyTranslation extends BaseEntity {
  @Column({ name: 'run_id', type: 'uuid', nullable: false })
  runId: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: false })
  entityId: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  translationType: TranslationType;

  @Column({ name: 'source_currency', type: 'varchar', length: 3, nullable: false })
  sourceCurrency: string;

  @Column({ name: 'target_currency', type: 'varchar', length: 3, nullable: false })
  targetCurrency: string;

  @Column({ name: 'translation_method', type: 'varchar', length: 20, nullable: false })
  translationMethod: TranslationMethod;

  @Column({ name: 'exchange_rate', type: 'numeric', precision: 10, scale: 6, nullable: false })
  exchangeRate: number;

  @Column({ name: 'original_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  originalAmount: number;

  @Column({ name: 'translated_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  translatedAmount: number;

  @Column({ name: 'cumulative_translation_adj', type: 'numeric', precision: 18, scale: 2, default: 0 })
  cumulativeTranslationAdj: number;

  @Column({ name: 'fx_gain_loss', type: 'numeric', precision: 18, scale: 2, default: 0 })
  fxGainLoss: number;

  @Column({ name: 'rate_source', type: 'varchar', length: 50, nullable: true })
  rateSource: string | null;

  @Column({ name: 'rate_timestamp', type: 'timestamptz', nullable: true })
  rateTimestamp: Date | null;
}
