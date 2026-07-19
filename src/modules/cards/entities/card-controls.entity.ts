import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

@Entity('card_controls')
export class CardControls extends BaseEntity {
  @Column({ name: 'card_id', type: 'uuid', unique: true, nullable: false })
  cardId: string;

  @Column({ name: 'contactless_enabled', type: 'boolean', default: true })
  contactlessEnabled: boolean;

  @Column({ name: 'online_purchases_enabled', type: 'boolean', default: true })
  onlinePurchasesEnabled: boolean;

  @Column({ name: 'international_transactions_enabled', type: 'boolean', default: true })
  internationalTransactionsEnabled: boolean;

  @Column({ name: 'atm_withdrawals_enabled', type: 'boolean', default: true })
  atmWithdrawalsEnabled: boolean;

  @Column({ name: 'mcc_blocked_list', type: 'text', array: true, default: '{}' })
  mccBlockedList: string[];

  @Column({ name: 'mcc_allowed_list', type: 'text', array: true, default: '{}' })
  mccAllowedList: string[];

  @Column({ name: 'geographic_restrictions', type: 'jsonb', default: () => '\'{}\'::jsonb' })
  geographicRestrictions: Record<string, unknown>;

  @Column({ name: 'merchant_blocked_list', type: 'text', array: true, default: '{}' })
  merchantBlockedList: string[];

  @Column({ name: 'transaction_alerts_enabled', type: 'boolean', default: true })
  transactionAlertsEnabled: boolean;

  @Column({ name: 'alert_threshold_amount', type: 'numeric', precision: 18, scale: 2, default: 1000 })
  alertThresholdAmount: number;

  @Column({ name: 'virtual_card_enabled', type: 'boolean', default: true })
  virtualCardEnabled: boolean;

  @Column({ name: 'subscription_payments_enabled', type: 'boolean', default: true })
  subscriptionPaymentsEnabled: boolean;
}
