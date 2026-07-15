import {
  Entity, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum DpiaStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('privacy_dpiassessment')
export class PrivacyDpiaAssessment extends BaseEntity {
  @Column({ name: 'activity_id', type: 'uuid', nullable: false })
  activityId: string;

  @Column({ name: 'risk_level', type: 'varchar', length: 10, nullable: false })
  riskLevel: RiskLevel;

  @Column({ name: 'risk_description', type: 'text', nullable: true })
  riskDescription: string | null;

  @Column({ name: 'mitigation_measures', type: 'text', nullable: true })
  mitigationMeasures: string | null;

  @Column({ name: 'residual_risk', type: 'varchar', length: 10, nullable: true })
  residualRisk: RiskLevel | null;

  @Column({ name: 'consulted_dpo', type: 'boolean', default: false })
  consultedDpo: boolean;

  @Column({ name: 'dpo_opinion', type: 'text', nullable: true })
  dpoOpinion: string | null;

  @Column({ name: 'supervisory_authority_notified', type: 'boolean', default: false })
  supervisoryAuthorityNotified: boolean;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: DpiaStatus;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;
}
