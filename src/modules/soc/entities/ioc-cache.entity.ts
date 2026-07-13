import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum IoCType {
  IPV4 = 'IPV4',
  IPV6 = 'IPV6',
  DOMAIN = 'DOMAIN',
  URL = 'URL',
  HASH_MD5 = 'HASH_MD5',
  HASH_SHA1 = 'HASH_SHA1',
  HASH_SHA256 = 'HASH_SHA256',
  EMAIL = 'EMAIL',
}

export enum IoCTag {
  MALWARE = 'MALWARE',
  PHISHING = 'PHISHING',
  C2 = 'C2',
  EXPLOIT = 'EXPLOIT',
  SCANNER = 'SCANNER',
  SPAM = 'SPAM',
  TOR_EXIT = 'TOR_EXIT',
}

@Entity('ioc_cache')
export class IoCCache extends BaseEntity {
  @Column({ type: 'enum', enum: IoCType })
  type: IoCType;

  @Column({ type: 'text' })
  value: string;

  @Column({ length: 100 })
  source: string;

  @Column({ name: 'feed_id', type: 'uuid', nullable: true })
  feedId: string | null;

  @Column({ name: 'confidence_score', type: 'int', default: 50 })
  confidenceScore: number;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ name: 'first_seen', type: 'timestamptz', default: () => 'NOW()' })
  firstSeen: Date;

  @Column({ name: 'last_seen', type: 'timestamptz', default: () => 'NOW()' })
  lastSeen: Date;

  @Column({ name: 'is_blocked', type: 'boolean', default: true })
  isBlocked: boolean;

  @Column({ name: 'expiration', type: 'timestamptz', nullable: true })
  expiration: Date | null;
}
