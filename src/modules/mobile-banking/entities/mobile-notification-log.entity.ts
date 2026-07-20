import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('mobile_notification_log')
export class MobileNotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 50, name: 'notification_type' })
  notificationType: string; // transaction_alert / balance_low / deposit_received / card_transaction / p2p_received / statement_ready / cd_maturity / loan_due / fraud_alert / promotion

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', name: 'body_text' })
  bodyText: string;

  @Column({ type: 'jsonb', nullable: true, name: 'payload_data' })
  payloadData: Record<string, any>;

  @Column({ type: 'varchar', length: 20, name: 'priority_level', default: 'normal' })
  priorityLevel: string; // low / normal / high / critical

  @Column({ type: 'text', array: true, nullable: true, name: 'channels_attempted' })
  channelsAttempted: string[]; // push / in_app / email / sms

  @Column({ type: 'boolean', name: 'push_delivered', default: false })
  pushDelivered: boolean;

  @Column({ type: 'boolean', name: 'push_opened', default: false })
  pushOpened: boolean;

  @Column({ type: 'boolean', name: 'in_app_read', default: false })
  inAppRead: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'delivered_at' })
  deliveredAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'opened_at' })
  openedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'read_at' })
  readAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'dismissed_at' })
  dismissedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
