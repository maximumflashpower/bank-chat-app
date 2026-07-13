import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum AuthType {
  API_KEY = 'API_KEY',
  OAUTH = 'OAUTH',
  BASIC = 'BASIC',
  NONE = 'NONE',
}

@Entity('threat_intel_feed')
export class ThreatIntelFeed extends BaseEntity {
  @Column({ name: 'provider_name', length: 100 })
  providerName: string;

  @Column({ name: 'feed_url', type: 'text' })
  feedUrl: string;

  @Column({ name: 'auth_type', type: 'enum', enum: AuthType })
  authType: AuthType;

  @Column({ name: 'api_key_encrypted', type: 'text', nullable: true })
  apiKeyEncrypted: string | null;

  @Column({ name: 'sync_frequency_hours', type: 'int', default: 24 })
  syncFrequencyHours: number;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @Column({ name: 'ioc_count_loaded', type: 'int', default: 0 })
  iocCountLoaded: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'categories_covered', type: 'text', array: true, default: [] })
  categoriesCovered: string[];

  @Column({ name: 'confidence_threshold', type: 'int', default: 70 })
  confidenceThreshold: number;

  @Column({ name: 'shared_anonymous', type: 'boolean', default: false })
  sharedAnonymous: boolean;
}
