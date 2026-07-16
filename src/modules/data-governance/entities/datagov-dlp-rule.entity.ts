import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum DlpAction {
  BLOCK = 'block',
  MASK = 'mask',
  LOG = 'log',
  WARN = 'warn',
}

export enum DlpSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('datagov_dlp_rule')
export class DatagovDlpRule extends BaseEntity {
  @Column({ name: 'rule_name', type: 'varchar', length: 255, nullable: false, unique: true })
  ruleName: string;

  @Column({ name: 'detection_pattern', type: 'text', nullable: false })
  detectionPattern: string;

  @Column({ name: 'data_types_matched', type: 'text', array: true, nullable: false })
  dataTypesMatched: string[];

  @Column({ type: 'varchar', length: 20, default: 'log' })
  action: DlpAction;

  @Column({ name: 'channels_applied', type: 'text', array: true, nullable: false })
  channelsApplied: string[];

  @Column({ name: 'user_exceptions', type: 'uuid', array: true, nullable: true })
  userExceptions: string[] | null;

  @Column({ type: 'varchar', length: 10, default: 'medium' })
  severity: DlpSeverity;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
