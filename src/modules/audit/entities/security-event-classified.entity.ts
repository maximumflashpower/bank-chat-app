import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { ForensicSeverity } from './forensic-severity.enum';
import { SecurityEventCategory } from './security-event-category.enum';

@Entity({ name: 'security_events_classified' })
export class SecurityEventClassified extends BaseEntity {
  @ApiProperty({ example: 'firewall' })
  @Column({ name: 'source_component', type: 'varchar', length: 100 })
  sourceComponent: string;

  @Column({ name: 'event_timestamp', type: 'timestamptz' })
  eventTimestamp: Date;

  @ApiProperty({ enum: ForensicSeverity })
  @Column({ name: 'severity_level', type: 'enum', enum: ForensicSeverity })
  severityLevel: ForensicSeverity;

  @ApiProperty({ enum: SecurityEventCategory })
  @Column({ name: 'category', type: 'enum', enum: SecurityEventCategory })
  category: SecurityEventCategory;

  @Column({ name: 'target_resource', type: 'text', nullable: true })
  targetResource: string | null;

  @Column({ name: 'attacker_ip', type: 'inet', nullable: true })
  attackerIp: string | null;

  @Column({ name: 'attack_signature', type: 'varchar', length: 255, nullable: true })
  attackSignature: string | null;

  @Column({ name: 'classified_as_incident', type: 'boolean', default: false })
  classifiedAsIncident: boolean;

  @Index()
  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string | null;

  @Column({ name: 'analyzed_at', type: 'timestamptz', nullable: true })
  analyzedAt: Date | null;

  @Column({ name: 'false_positive', type: 'boolean', default: false })
  falsePositive: boolean;

  @Column({ name: 'remediation_action', type: 'text', nullable: true })
  remediationAction: string | null;
}
