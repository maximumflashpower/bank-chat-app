import {
  Entity, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

@Entity('privacy_processing_activity')
export class PrivacyProcessingActivity extends BaseEntity {
  @Column({ name: 'activity_name', type: 'varchar', length: 255, nullable: false })
  activityName: string;

  @Column({ type: 'text', nullable: false })
  purpose: string;

  @Column({ name: 'data_categories', type: 'text', array: true, nullable: false })
  dataCategories: string[];

  @Column({ name: 'data_subjects', type: 'text', array: true, nullable: false })
  dataSubjects: string[];

  @Column({ name: 'legal_basis', type: 'varchar', length: 50, nullable: false })
  legalBasis: string;

  @Column({ type: 'text', array: true, nullable: true })
  recipients: string[];

  @Column({ name: 'transfer_countries', type: 'text', array: true, nullable: true })
  transferCountries: string[];

  @Column({ name: 'retention_period', type: 'varchar', length: 50, nullable: true })
  retentionPeriod: string;

  @Column({ name: 'security_measures', type: 'text', array: true, nullable: true })
  securityMeasures: string[];

  @Column({ name: 'dpo_approved', type: 'boolean', default: false })
  dpoApproved: boolean;
}
