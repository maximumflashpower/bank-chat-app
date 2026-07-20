import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum ConversionSettlementStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('crypto_fiat_conversion')
@Index(['customerId'])
@Index(['conversionNumber'])
export class CryptoFiatConversion extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'conversion_number' })
  @Index()
  conversionNumber: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 10, name: 'source_crypto_currency' })
  sourceCryptoCurrency: string;

  @Column({ type: 'varchar', length: 3, name: 'destination_fiat_currency' })
  destinationFiatCurrency: string;

  @Column({ type: 'numeric', precision: 18, scale: 8, name: 'source_crypto_amount' })
  sourceCryptoAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'destination_fiat_amount' })
  destinationFiatAmount: number;

  @Column({ type: 'numeric', precision: 12, scale: 6, name: 'exchange_rate_applied' })
  exchangeRateApplied: number;

  @Column({ type: 'numeric', precision: 12, scale: 6, nullable: true, name: 'spot_rate_market' })
  spotRateMarket?: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'spread_markup_pct' })
  spreadMarkupPct?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'conversion_fee_amount' })
  conversionFeeAmount?: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'executed_at_price_tick' })
  executedAtPriceTick?: Date;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'slippage_tolerance_pct' })
  slippageTolerancePct?: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'actual_slippage_pct' })
  actualSlippagePct?: number;

  @Column({ type: 'varchar', length: 20, name: 'settlement_status' })
  settlementStatus: ConversionSettlementStatus;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'blockchain_txn_hash' })
  blockchainTxnHash?: string;

  @Column({ type: 'int', nullable: true, name: 'confirmed_block_depth' })
  confirmedBlockDepth?: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'wallet_provider_internal' })
  walletProviderInternal?: string;

  @Column({ type: 'uuid', nullable: true, name: 'journal_entry_ref' })
  journalEntryRef?: string;
}
