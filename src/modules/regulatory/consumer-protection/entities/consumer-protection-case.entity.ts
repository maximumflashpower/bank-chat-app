import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ConsumerProtectionMonitor } from './consumer-protection-monitor.entity';
import { BaseEntity } from '../../../../common/base.entity';
import { CaseStatus, ViolationSeverity, RegulationType } from './consumer-protection-enum';

@Entity('consumer_protection_case')
export class ConsumerProtectionCase extends BaseEntity {
  @Column({ name: 'case_number', type: 'varchar', length: 50, unique: true, nullable: false })
  caseNumber: string;

  @Column({ name: 'monitor_id', type: 'uuid', nullable: false })
  monitorId: string;

  @Column({ name: 'regulation_type', type: 'varchar', length: 20, nullable: false })
  regulationType: RegulationType;

  @Column({ name: 'case_status', type: 'varchar', length: 20, default: 'open' })
  caseStatus: CaseStatus;

  @Column({ name: 'violation_severity', type: 'varchar', length: 10, nullable: false })
  violationSeverity: ViolationSeverity;

  @Column({ name: 'violation_title', type: 'varchar', length: 255, nullable: false })
  violationTitle: string;

  @Column({ name: 'violation_description', type: 'text', nullable: true })
  violationDescription: string;

  @Column({ name: 'affected_customers_count', type: 'integer', default: 0 })
  affectedCustomersCount: number;

  @Column({ name: 'affected_accounts_count', type: 'integer', default: 0 })
  affectedAccountsCount: number;

  @Column({ name: 'potential_exposure_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  potentialExposureAmount: number | null;

  @Column({ name: 'discovered_at', type: 'timestamptz', nullable: false })
  discoveredAt: Date;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string | null;

  @Column({ name: 'escalated_at', type: 'timestamptz', nullable: true })
  escalatedAt: Date | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string | null;

  @Column({ name: 'remediation_action_taken', type: 'text', nullable: true })
  remediationActionTaken: string | null;

  @Column({ name: 'regulator_notified', type: 'boolean', default: false })
  regulatorNotified: boolean;

  @Column({ name: 'regulator_notification_date', type: 'timestamptz', nullable: true })
  regulatorNotificationDate: Date | null;

  @Column({ name: 'customer_notified', type: 'boolean', default: false })
  customerNotified: boolean;

  @Column({ name: 'customer_notification_date', type: 'timestamptz', nullable: true })
  customerNotificationDate: Date | null;

  @Column({ name: 'source_transaction_ids', type: 'text', array: true, nullable: true })
  sourceTransactionIds: string[] | null;

  @Column({ name: 'evidence_documents', type: 'text', array: true, nullable: true })
  evidenceDocuments: string[] | null;

  @Column({ name: 'priority_score', type: 'integer', nullable: true })
  priorityScore: number | null;

  @Column({ name: 'is_false_positive', type: 'boolean', default: false })
  isFalsePositive: boolean;

  @ManyToOne(() => ConsumerProtectionMonitor, (monitor) => monitor.cases)
  @JoinColumn({ name: 'monitor_id', referencedColumnName: 'id' })
  monitor: ConsumerProtectionMonitor;
}
