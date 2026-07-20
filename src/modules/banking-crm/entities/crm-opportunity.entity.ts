import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum OpportunityType {
  CROSS_SELL = 'cross_sell',
  UP_SELL = 'up_sell',
  RETENTION = 'retention',
  WINBACK = 'winback',
}

export enum OpportunityStage {
  IDENTIFIED = 'identified',
  QUALIFIED = 'qualified',
  PROPOSED = 'proposed',
  NEGOTIATING = 'negotiating',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

export enum PreviousOfferResult {
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  PENDING = 'pending',
}

@Entity('crm_opportunity')
@Index(['customerId'])
@Index(['opportunityNumber'])
export class CrmOpportunity extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'opportunity_number' })
  @Index()
  opportunityNumber: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 50, name: 'product_suggested' })
  productSuggested: string;

  @Column({ type: 'varchar', length: 20, name: 'opportunity_type' })
  opportunityType: OpportunityType;

  @Column({ type: 'varchar', length: 20, default: 'identified' })
  stage: OpportunityStage;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'probability_win_pct' })
  probabilityWinPct?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'estimated_value' })
  estimatedValue?: number;

  @Column({ type: 'date', nullable: true, name: 'expected_close_date' })
  expectedCloseDate?: Date;

  @Column({ type: 'text', nullable: true, name: 'nba_recommendation_reason' })
  nbaRecommendationReason?: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'ai_confidence_score' })
  aiConfidenceScore?: number;

  @Column({ type: 'boolean', default: false, name: 'previously_offered' })
  previouslyOffered: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'previous_offer_result' })
  previousOfferResult?: PreviousOfferResult;

  @Column({ type: 'uuid', name: 'advisor_id' })
  advisorId: string;

  @Column({ type: 'uuid', nullable: true, name: 'interaction_origin_id' })
  interactionOriginId?: string;

  @Column({ type: 'varchar', length: 30, nullable: true, name: 'channel_originated' })
  channelOriginated?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'closed_at' })
  closedAt?: Date;

  @Column({ type: 'text', nullable: true, name: 'closure_reason' })
  closureReason?: string;
}
