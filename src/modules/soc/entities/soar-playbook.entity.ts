import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum PlaybookTrigger {
  PHISHING_DETECTED = 'PHISHING_DETECTED',
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  RANSOMWARE_DETECTED = 'RANSOMWARE_DETECTED',
  APT_DETECTED = 'APT_DETECTED',
  DDOS_DETECTED = 'DDOS_DETECTED',
  MANUAL = 'MANUAL',
}

export enum PlaybookExecutionMode {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
  SEMIAUTO = 'SEMIAUTO',
}

@Entity('soar_playbook')
export class SoarPlaybook extends BaseEntity {
  @Column({ length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'playbook_trigger', type: 'enum', enum: PlaybookTrigger })
  playbookTrigger: PlaybookTrigger;

  @Column({ name: 'playbook_steps', type: 'jsonb' })
  playbookSteps: Record<string, unknown>;

  @Column({ name: 'execution_mode', type: 'enum', enum: PlaybookExecutionMode, default: PlaybookExecutionMode.MANUAL })
  executionMode: PlaybookExecutionMode;

  @Column({ name: 'approval_required', type: 'boolean', default: false })
  approvalRequired: boolean;

  @Column({ name: 'success_rate_pct', type: 'numeric', precision: 5, scale: 2, nullable: true })
  successRatePct: number | null;

  @Column({ name: 'avg_execution_minutes', type: 'numeric', precision: 6, scale: 2, nullable: true })
  avgExecutionMinutes: number | null;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;
}
