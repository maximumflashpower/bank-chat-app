import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum ChannelType {
  QR_SCAN = 'qr_scan',
  NFC_CONTACTLESS = 'nfc_contactless',
  P2P = 'p2p',
  WEB_CHECKOUT = 'web_checkout',
  API_EMBEDDED = 'api_embedded',
  MOBILE_DEPOSIT = 'mobile_deposit',
}

export enum ReconciliationStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  CLEARED = 'cleared',
  EXCEPTION = 'exception',
}

export enum RiskDecision {
  APPROVED = 'approved',
  DECLINED = 'declined',
  CHALLENGED = 'challenged',
}

@Entity('payment_transaction_hub')
@Index(['initiatorId'])
@Index(['paymentReference'])
export class PaymentTransactionHub extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'payment_reference' })
  @Index()
  paymentReference: string;

  @Column({ type: 'uuid', name: 'initiator_id' })
  initiatorId: string;

  @Column({ type: 'varchar', length: 30, name: 'channel_type' })
  channelType: ChannelType;

  @Column({ type: 'uuid', name: 'payment_method_used' })
  paymentMethodUsed: string;

  @Column({ type: 'varchar', length: 255, name: 'payee_payer_identifier' })
  payeePayerIdentifier: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, name: 'currency_iso_code' })
  currencyIsoCode: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0, name: 'transaction_fee' })
  transactionFee: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'net_settlement_amount' })
  netSettlementAmount?: number;

  @Column({ type: 'simple-array', nullable: true, name: 'split_participant_ids' })
  splitParticipantIds?: string[];

  @Column({ type: 'jsonb', nullable: true, name: 'split_percentages' })
  splitPercentages?: Record<string, number>;

  @Column({ type: 'uuid', nullable: true, name: 'original_txn_reference' })
  originalTxnReference?: string;

  @Column({ type: 'uuid', nullable: true, name: 'dispute_case_id' })
  disputeCaseId?: string;

  @Column({ type: 'varchar', length: 20, default: 'pending', name: 'reconciliation_status' })
  reconciliationStatus: ReconciliationStatus;

  @Column({ type: 'uuid', nullable: true, name: 'settlement_batch_id' })
  settlementBatchId?: string;

  @Column({ type: 'boolean', default: false, name: 'webhook_notification_sent' })
  webhookNotificationSent: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'ledger_journal_entry_id' })
  ledgerJournalEntryId?: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'risk_score_calculated' })
  riskScoreCalculated?: number;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'risk_decision_final' })
  riskDecisionFinal?: RiskDecision;

  @Column({ type: 'timestamptz', name: 'processed_at' })
  processedAt: Date;
}
