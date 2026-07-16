import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum DispositionAction {
  DELETE = 'delete',
  ANONYMIZE = 'anonymize',
  ARCHIVE = 'archive',
}

@Entity('datagov_retention_policy')
export class DatagovRetentionPolicy extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  @Column({ name: 'data_category', type: 'varchar', length: 100, nullable: false })
  dataCategory: string;

  @Column({ name: 'retention_days', type: 'integer', nullable: false })
  retentionDays: number;

  @Column({ name: 'legal_hold_override', type: 'boolean', default: false })
  legalHoldOverride: boolean;

  @Column({ name: 'legal_basis', type: 'varchar', length: 100, nullable: true })
  legalBasis: string | null;

  @Column({ name: 'disposition_action', type: 'varchar', length: 20, default: 'delete' })
  dispositionAction: DispositionAction;

  @Column({ name: 'notification_days_before', type: 'integer', default: 7 })
  notificationDaysBefore: number;

  @Column({ name: 'soft_delete_period_days', type: 'integer', default: 30 })
  softDeletePeriodDays: number;

  @Column({ name: 'auto_execute', type: 'boolean', default: true })
  autoExecute: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;
}
