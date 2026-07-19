import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum UnderwritingDecision {
  APPROVED = 'approved',
  CONDITIONAL = 'conditional',
  DECLINED = 'declined',
  REFERRED = 'referred',
}

@Entity('underwriting_assessments')
export class UnderwritingAssessment extends BaseEntity {
  @Column({ name: 'policy_id', type: 'uuid', nullable: true })
  policyId: string | null;

  @Column({ name: 'quote_id', type: 'uuid', nullable: true })
  quoteId: string | null;

  @Column({ name: 'risk_score', type: 'integer', nullable: false })
  riskScore: number;

  @Column({ name: 'risk_factors', type: 'jsonb', nullable: false })
  riskFactors: Record<string, any>;

  @Column({ name: 'recommended_decision', type: 'varchar', length: 20, nullable: true })
  recommendedDecision: UnderwritingDecision | null;

  @Column({ name: 'final_decision', type: 'varchar', length: 20, nullable: true })
  finalDecision: UnderwritingDecision | null;

  @Column({ name: 'assessed_by', type: 'uuid', nullable: true })
  assessedBy: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;
}
