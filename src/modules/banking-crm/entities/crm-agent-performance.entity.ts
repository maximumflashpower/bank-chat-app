import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum SatisfactionTrend {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DECLINING = 'declining',
}

@Entity('crm_agent_performance')
@Index(['agentId'])
@Index(['periodMonth'])
export class CrmAgentPerformance extends BaseEntity {
  @Column({ type: 'uuid', name: 'agent_id' })
  agentId: string;

  @Column({ type: 'varchar', length: 7, name: 'period_month' })
  periodMonth: string;

  @Column({ type: 'int', default: 0, name: 'total_interactions_handled' })
  totalInteractionsHandled: number;

  @Column({ type: 'int', nullable: true, name: 'avg_resolution_time_seconds' })
  avgResolutionTimeSeconds?: number;

  @Column({ type: 'int', nullable: true, name: 'avg_wait_time_assigned_seconds' })
  avgWaitTimeAssignedSeconds?: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'sla_compliance_rate_pct' })
  slaComplianceRatePct?: number;

  @Column({ type: 'numeric', precision: 3, scale: 2, nullable: true, name: 'csat_avg_rating' })
  csatAvgRating?: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'nps_avg_score' })
  npsAvgScore?: number;

  @Column({ type: 'int', default: 0, name: 'opportunities_identified' })
  opportunitiesIdentified: number;

  @Column({ type: 'int', default: 0, name: 'opportunities_closed_won' })
  opportunitiesClosedWon: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'conversion_rate_pct' })
  conversionRatePct?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'revenue_attributed' })
  revenueAttributed?: number;

  @Column({ type: 'int', default: 0, name: 'escalations_count' })
  escalationsCount: number;

  @Column({ type: 'int', default: 0, name: 'complaints_received' })
  complaintsReceived: number;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'satisfaction_trend' })
  satisfactionTrend?: SatisfactionTrend;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'quality_audit_score' })
  qualityAuditScore?: number;
}
