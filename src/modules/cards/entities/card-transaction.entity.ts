import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum TransactionType {
  PURCHASE = 'purchase',
  ATM_WITHDRAWAL = 'atm_withdrawal',
  CASH_ADVANCE = 'cash_advance',
  REFUND = 'refund',
  PAYMENT = 'payment',
  FEE = 'fee',
  INTEREST_CHARGE = 'interest_charge',
}

export enum FraudDecision {
  APPROVED = 'approved',
  DECLINED = 'declined',
  CHALLENGED = 'challenged',
}

@Entity('card_transaction')
export class CardTransaction extends BaseEntity {
  @Column({ name: 'card_id', type: 'uuid', nullable: false })
  cardId: string;

  @Column({ name: 'transaction_type', type: 'varchar', length: 20, nullable: false })
  transactionType: TransactionType;

  @Column({ name: 'authorization_code', type: 'varchar', length: 10, nullable: true })
  authorizationCode: string | null;

  @Column({ name: 'transaction_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  transactionAmount: number;

  @Column({ name: 'transaction_currency', type: 'varchar', length: 3, nullable: false })
  transactionCurrency: string;

  @Column({ name: 'billing_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  billingAmount: number;

  @Column({ name: 'billing_currency', type: 'varchar', length: 3, nullable: false })
  billingCurrency: string;

  @Column({ name: 'fx_rate_applied', type: 'numeric', precision: 12, scale: 6, nullable: true })
  fxRateApplied: number | null;

  @Column({ name: 'fx_fee_charged', type: 'numeric', precision: 18, scale: 2, default: 0 })
  fxFeeCharged: number;

  @Column({ name: 'merchant_name', type: 'varchar', length: 255, nullable: true })
  merchantName: string | null;

  @Column({ name: 'merchant_category_code', type: 'varchar', length: 4, nullable: true })
  merchantCategoryCode: string | null;

  @Column({ name: 'merchant_location_city', type: 'varchar', length: 255, nullable: true })
  merchantLocationCity: string | null;

  @Column({ name: 'merchant_location_country', type: 'varchar', length: 2, nullable: true })
  merchantLocationCountry: string | null;

  @Column({ name: 'merchant_terminal_id', type: 'varchar', length: 50, nullable: true })
  merchantTerminalId: string | null;

  @Column({ name: 'merchant_id_external', type: 'varchar', length: 50, nullable: true })
  merchantIdExternal: string | null;

  @Column({ name: 'pos_entry_mode', type: 'varchar', length: 20, nullable: true })
  posEntryPointMode: string | null;

  @Column({ name: 'token_used', type: 'varchar', length: 100, nullable: true })
  tokenUsed: string | null;

  @Column({ name: 'fraud_score', type: 'numeric', precision: 5, scale: 2, default: 0 })
  fraudScore: number;

  @Column({ name: 'fraud_decision', type: 'varchar', length: 20, default: FraudDecision.APPROVED })
  fraudDecision: FraudDecision;

  @Column({ name: 'fraud_factors', type: 'jsonb', default: () => '\'[]\'::jsonb' })
  fraudFactors: string[];

  @Column({ name: 'challenge_method', type: 'varchar', length: 20, nullable: true })
  challengeMethod: string | null;

  @Column({ name: 'challenge_result', type: 'varchar', length: 20, nullable: true })
  challengeResult: string | null;

  @Column({ name: 'rewards_earned', type: 'numeric', precision: 18, scale: 2, default: 0 })
  rewardsEarned: number;

  @Column({ type: 'varchar', length: 20, default: 'authorized' })
  status: string;

  @Column({ name: 'ledger_journal_entry_id', type: 'uuid', nullable: true })
  ledgerJournalEntryId: string | null;

  @Column({ name: 'dispute_case_id', type: 'uuid', nullable: true })
  disputeCaseId: string | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: false })
  processedAt: Date;
}
