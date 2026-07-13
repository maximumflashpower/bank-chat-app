import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AlertStatus {
  NEW = 'NEW',
  INVESTIGATING = 'INVESTIGATING',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  TRUE_POSITIVE = 'TRUE_POSITIVE',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

@Entity('soc_alert')
export class SocAlert extends BaseEntity {
  @Column({ length: 100 })
  eventSource: string;

  @Column({ length: 100 })
  eventType: string;

  @Column({ type: 'enum', enum: AlertSeverity })
  severity: AlertSeverity;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.NEW })
  status: AlertStatus;

  @Column({ type: 'uuid', nullable: true })
  correlationGroup: string | null;

  @Column({ type: 'int', default: 1 })
  correlatedEventsCount: number;

  @Column({ name: 'first_seen_at', type: 'timestamptz', nullable: true })
  firstSeenAt: Date | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @Column({ name: 'src_ip', type: 'inet', nullable: true })
  srcIp: string | null;

  @Column({ name: 'dst_ip', type: 'inet', nullable: true })
  dstIp: string | null;

  @Column({ name: 'asset_id', type: 'uuid', nullable: true })
  assetId: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'analyst_assigned', type: 'uuid', nullable: true })
  analystAssigned: string | null;

  @Column({ name: 'triaged_at', type: 'timestamptz', nullable: true })
  triagedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'false_positive_reason', type: 'text', nullable: true })
  falsePositiveReason: string | null;
}
