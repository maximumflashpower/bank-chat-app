import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum BreachSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum BreachStatus {
  DETECTED = 'detected',
  ASSESSED = 'assessed',
  ASSESSING = 'assessing',
  NOTIFIED_AUTHORITY = 'notified_authority',
  NOTIFIED_USERS = 'notified_users',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CONTAINED = 'contained',
}

@Entity('privacy_breach_notification')
export class PrivacyBreachNotification extends BaseEntity {
  @Column({ name: 'breach_title', type: 'varchar', length: 255, nullable: false })
  breachTitle: string;

  @Column({ name: 'breach_description', type: 'text', nullable: false })
  breachDescription: string;

  @Column({ type: 'varchar', length: 10, default: 'low' })
  severity: BreachSeverity;

  @Column({ type: 'varchar', length: 20, default: 'detected' })
  status: BreachStatus;

  @Column({ name: 'detected_at', type: 'timestamptz', nullable: false })
  detectedAt: Date;

  @Column({ name: 'contained_at', type: 'timestamptz', nullable: true })
  containedAt: Date | null | null;

  @Column({ name: 'affected_users_count', type: 'integer', nullable: true })
  affectedUsersCount: number;

  @Column({ name: 'data_categories_affected', type: 'text', array: true, nullable: true })
  dataCategoriesAffected: string[] | null;

  @Column({ name: 'authority_notified_at', type: 'timestamptz', nullable: true })
  authorityNotifiedAt: Date | null | null;

  @Column({ name: 'users_notified_at', type: 'timestamptz', nullable: true })
  usersNotifiedAt: Date | null | null;

  @Column({ name: 'evidence_preserved', type: 'boolean', default: false })
  evidencePreserved: boolean;

  @Column({ name: 'remediation_actions', type: 'text', nullable: true })
  remediationActions: string | null;

  @Column({ name: 'reported_by', type: 'uuid', nullable: false })
  reportedBy: string;

  @Column({ name: 'detection_source', type: 'varchar', length: 50, default: 'manual', nullable: true })
  detectionSource: string;

  @Column({ name: 'notification_deadline', type: 'timestamptz', nullable: true })
  notificationDeadline: Date | null;

  @Column({ name: 'incident_notes', type: 'text', nullable: true })
  incidentNotes: string | null;

  @Column({ name: 'authority_notification_notes', type: 'text', nullable: true })
  authorityNotificationNotes: string | null;

  @Column({ name: 'user_notification_notes', type: 'text', nullable: true })
  userNotificationNotes: string | null;

  @Column({ name: 'root_cause', type: 'text', nullable: true })
  rootCause: string | null;

  @Column({ name: 'forensic_hash', type: 'varchar', length: 255, nullable: true })
  forensicHash: string | null;

  @Column({ name: "attack_category", type: "varchar", length: 100, nullable: true })
  attackCategory: string | null;
  @Column({ name: "description", type: "text", nullable: true })
  description: string | null;
  @Column({ name: "investigator_name", type: "varchar", length: 255, nullable: true })
  investigatorName: string | null;

  get severityLevel(): BreachSeverity { return this.severity; }
  set severityLevel(value: BreachSeverity) { this.severity = value; }
}
