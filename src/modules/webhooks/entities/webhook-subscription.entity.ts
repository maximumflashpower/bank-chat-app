import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum WebhookStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('api_webhook_subscription')
export class WebhookSubscription extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'endpoint_url', type: 'text' })
  endpointUrl: string;

  @Column({ name: 'event_types', type: 'text', array: true, default: [] })
  eventTypes: string[];

  @Column({ name: 'secret_key', type: 'text' })
  secretKey: string;

  @Column({ type: 'enum', enum: WebhookStatus, default: WebhookStatus.ACTIVE })
  status: WebhookStatus;

  @Column({ name: 'api_version', length: 10, default: 'v1' })
  apiVersion: string;

  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries: number;

  @Column({ name: 'retry_backoff_ms', type: 'int', default: 1000 })
  retryBackoffMs: number;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string> | null;

  @Column({ name: 'last_triggered_at', type: 'timestamptz', nullable: true })
  lastTriggeredAt: Date | null;

  @Column({ name: 'total_deliveries', type: 'bigint', default: 0 })
  totalDeliveries: number;

  @Column({ name: 'successful_deliveries', type: 'bigint', default: 0 })
  successfulDeliveries: number;

  @Column({ name: 'failed_deliveries', type: 'bigint', default: 0 })
  failedDeliveries: number;
}
