import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum TellerTransactionType {
  DEPOSIT_CASH = 'deposit_cash',
  DEPOSIT_CHECK = 'deposit_check',
  WITHDRAWAL_CASH = 'withdrawal_cash',
  TRANSFER_INTERNAL = 'transfer_internal',
  CASH_CHECK = 'cash_check',
  MONEY_ORDER_ISSUE = 'money_order_issue',
  CASHIER_CHECK_ISSUE = 'cashier_check_issue',
  FOREIGN_EXCHANGE = 'foreign_exchange',
}

export enum TellerTransactionStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  REVERSED = 'reversed',
  VOIDED = 'voided',
}

@Entity('teller_transaction')
@Index(['transactionReference'])
@Index(['branchId'])
@Index(['customerId'])
export class TellerTransaction extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'transaction_reference' })
  transactionReference: string;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId: string;

  @Column({ type: 'uuid', name: 'teller_user_id' })
  tellerUserId: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 30, name: 'transaction_type' })
  transactionType: TellerTransactionType;

  @Column({ type: 'uuid', nullable: true, name: 'from_account_id' })
  fromAccountId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'to_account_id' })
  toAccountId?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'amount_principal' })
  amountPrincipal: number;

  @Column({ type: 'varchar', length: 3, default: 'USD', name: 'currency_code' })
  currencyCode: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0, name: 'fee_charged' })
  feeCharged: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'jsonb', nullable: true, name: 'denomination_detail' })
  denominationDetail?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true, name: 'check_images_refs' })
  checkImagesRefs?: Record<string, unknown>[];

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'cashier_check_number' })
  cashierCheckNumber?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'money_order_number' })
  moneyOrderNumber?: string;

  @Column({ type: 'numeric', precision: 12, scale: 6, nullable: true, name: 'foreign_exchange_rate' })
  foreignExchangeRate?: number;

  @Column({ type: 'varchar', length: 3, nullable: true, name: 'fx_from_currency' })
  fxFromCurrency?: string;

  @Column({ type: 'varchar', length: 3, nullable: true, name: 'fx_to_currency' })
  fxToCurrency?: string;

  @Column({ type: 'boolean', default: false, name: 'override_required' })
  overrideRequired: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'override_approved_by' })
  overrideApprovedBy?: string;

  @Column({ type: 'boolean', default: false, name: 'receipt_printed' })
  receiptPrinted: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'receipt_number' })
  receiptNumber?: string;

  @Column({ type: 'uuid', nullable: true, name: 'ledger_journal_entry_id' })
  ledgerJournalEntryId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'dual_control_witness_id' })
  dualControlWitnessId?: string;

  @Column({ type: 'varchar', length: 20, default: 'completed', name: 'transaction_status' })
  transactionStatus: TellerTransactionStatus;

  @Column({ type: 'text', nullable: true, name: 'reversal_reason' })
  reversalReason?: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'processed_at' })
  processedAt: Date;
}
