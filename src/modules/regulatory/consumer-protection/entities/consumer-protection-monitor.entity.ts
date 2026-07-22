import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';
import { RegulationType, MonitorStatus } from './consumer-protection-enum';
import { ConsumerProtectionCase } from './consumer-protection-case.entity';

@Entity('consumer_protection_monitor')
export class ConsumerProtectionMonitor extends BaseEntity {
  @Column({ name: 'regulation_type', type: 'varchar', length: 20, nullable: false })
  regulationType: RegulationType;

  @Column({ name: 'monitor_status', type: 'varchar', length: 20, default: 'active' })
  monitorStatus: MonitorStatus;

  @Column({ name: 'monitoring_rule_name', type: 'varchar', length: 100, nullable: false })
  monitoringRuleName: string;

  @Column({ name: 'rule_description', type: 'text', nullable: true })
  ruleDescription: string;

  @Column({ name: 'check_frequency_hours', type: 'integer', default: 24 })
  checkFrequencyHours: number;

  @Column({ name: 'last_check_run', type: 'timestamptz', nullable: true })
  lastCheckRun: Date | null;

  @Column({ name: 'next_scheduled_check', type: 'timestamptz', nullable: true })
  nextScheduledCheck: Date | null;

  @Column({ name: 'violations_detected_count', type: 'integer', default: 0 })
  violationsDetectedCount: number;

  @Column({ name: 'violations_resolved_count', type: 'integer', default: 0 })
  violationsResolvedCount: number;

  @Column({ name: 'false_positive_rate', type: 'numeric', precision: 5, scale: 4, default: 0 })
  falsePositiveRate: number;

  @Column({ name: 'severity_threshold', type: 'varchar', length: 10, default: 'medium' })
  severityThreshold: string;

  @Column({ name: 'auto_escalate', type: 'boolean', default: false })
  autoEscalate: boolean;

  @Column({ name: 'notification_recipients', type: 'text', array: true, nullable: true })
  notificationRecipients: string[] | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'last_modified_by', type: 'uuid', nullable: true })
  lastModifiedBy: string | null;

  @OneToMany(() => ConsumerProtectionCase, (caseEntity) => caseEntity.monitor)
  @JoinColumn({ name: 'id', referencedColumnName: 'monitorId' })
  cases: ConsumerProtectionCase[];
}
