import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum CustomerSegment {
  RETAIL = 'retail',
  SMB = 'smb',
  PREMIER = 'premier',
  WEALTH = 'wealth',
  CORPORATE = 'corporate',
}

export enum CustomerTier {
  STANDARD = 'standard',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

export enum RfmSegment {
  CHAMPION = 'Champion',
  LOYAL = 'Loyal',
  AT_RISK = 'AtRisk',
  HIBERNATING = 'Hibernating',
}

export enum ComplianceRiskFlag {
  CLEAR = 'clear',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ELEVATED = 'elevated',
}

@Entity('crm_customer_360_profile')
@Index(['customerId'])
export class CrmCustomer360Profile extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 255, name: 'full_name_display' })
  fullNameDisplay: string;

  @Column({ type: 'date', nullable: true, name: 'customer_since_date' })
  customerSinceDate?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'kyc_status_current' })
  kycStatusCurrent?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'kyc_last_verified_at' })
  kycLastVerifiedAt?: Date;

  @Column({ type: 'varchar', length: 30, nullable: true, name: 'customer_segment' })
  customerSegment?: CustomerSegment;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'customer_tier' })
  customerTier?: CustomerTier;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'rfm_segment' })
  rfmSegment?: RfmSegment;

  @Column({ type: 'int', nullable: true, name: 'total_products_held' })
  totalProductsHeld?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'total_relationship_balance' })
  totalRelationshipBalance?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'lifetime_value_estimate' })
  lifetimeValueEstimate?: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'churn_propensity_score' })
  churnPropensityScore?: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'cross_sell_propensity_score' })
  crossSellPropensityScore?: number;

  @Column({ type: 'uuid', nullable: true, name: 'next_best_action_id' })
  nextBestActionId?: string;

  @Column({ type: 'varchar', length: 30, nullable: true, name: 'last_interaction_channel' })
  lastInteractionChannel?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_interaction_at' })
  lastInteractionAt?: Date;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'preferred_language' })
  preferredLanguage?: string;

  @Column({ type: 'varchar', length: 30, nullable: true, name: 'preferred_contact_channel' })
  preferredContactChannel?: string;

  @Column({ type: 'boolean', default: false, name: 'vip_flag' })
  vipFlag: boolean;

  @Column({ type: 'varchar', length: 20, default: 'clear', name: 'compliance_risk_flag' })
  complianceRiskFlag: ComplianceRiskFlag;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_relationship_manager' })
  assignedRelationshipManager?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'notes_internal_json' })
  notesInternalJson?: Record<string, unknown>;
}
