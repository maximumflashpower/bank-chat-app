import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum AlertType {
  LOW_BALANCE = 'low_balance',
  LARGE_TRANSACTION = 'large_transaction',
  DEPOSIT_RECEIVED = 'deposit_received',
  WITHDRAWAL_MADE = 'withdrawal_made',
  TRANSFER_COMPLETED = 'transfer_completed',
  FEE_CHARGED = 'fee_charged',
  STATEMENT_READY = 'statement_ready',
  CD_MATURITY = 'cd_maturity',
}

export enum ThresholdComparison {
  ABOVE = 'above',
  BELOW = 'below',
  EQUALS = 'equals',
}

@Entity('retail_account_alert')
export class RetailAccountAlert extends BaseEntity {
  @Column({ name: 'account_id', type: 'uuid', nullable: false })
  accountId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ name: 'alert_type', type: 'varchar', length: 30, nullable: false })
  alertType: AlertType;

  @Column({ name: 'threshold_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  thresholdAmount: number | null;

  @Column({ name: 'threshold_comparison', type: 'varchar', length: 10, nullable: true })
  thresholdComparison: ThresholdComparison | null;

  @Column({ name: 'notification_channels', type: 'simple-array', nullable: true })
  notificationChannels: string[] | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_triggered_at', type: 'timestamptz', nullable: true })
  lastTriggeredAt: Date | null;

  @Column({ name: 'trigger_count', type: 'integer', default: 0 })
  triggerCount: number;
}
