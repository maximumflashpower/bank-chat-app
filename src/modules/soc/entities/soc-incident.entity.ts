import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum IncidentClassification {
  PHISHING = 'PHISHING',
  MALWARE = 'MALWARE',
  RANSOMWARE = 'RANSOMWARE',
  APT = 'APT',
  DDOS = 'DDOS',
  DATA_BREACH = 'DATA_BREACH',
}

export enum IncidentPriority {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  CONTAINING = 'CONTAINING',
  ERADICATING = 'ERADICATING',
  RECOVERING = 'RECOVERING',
  CLOSED = 'CLOSED',
}

@Entity('soc_incident')
export class SocIncident extends BaseEntity {
  @Column({ name: 'incident_number', length: 50, unique: true })
  incidentNumber: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'enum', enum: IncidentClassification })
  classification: IncidentClassification;

  @Column({ type: 'enum', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  severity: string;

  @Column({ type: 'enum', enum: IncidentPriority, default: IncidentPriority.P2 })
  priority: IncidentPriority;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.OPEN })
  status: IncidentStatus;

  @Column({ name: 'impact_summary', type: 'text', nullable: true })
  impactSummary: string | null;

  @Column({ name: 'root_cause', type: 'text', nullable: true })
  rootCause: string | null;

  @Column({ name: 'containment_actions', type: 'text', array: true, default: [] })
  containmentActions: string[];

  @Column({ name: 'eradication_actions', type: 'text', array: true, default: [] })
  eradicationActions: string[];

  @Column({ name: 'recovery_actions', type: 'text', array: true, default: [] })
  recoveryActions: string[];

  @Column({ name: 'lessons_learned', type: 'text', nullable: true })
  lessonsLearned: string | null;

  @Column({ name: 'assigned_lead', type: 'uuid', nullable: true })
  assignedLead: string | null;

  @Column({ name: 'sla_response_hours', type: 'numeric', precision: 4, scale: 1, nullable: true })
  slaResponseHours: number | null;

  @Column({ name: 'opened_at', type: 'timestamptz', default: () => 'NOW()' })
  openedAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
