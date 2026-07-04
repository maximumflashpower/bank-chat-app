import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { DecisionResult } from './decision-result.enum';

@Entity({ name: 'gov_decision_logs' })
export class GovDecisionLog extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  policyId: string;

  @Column({ type: 'int' })
  policyVersion: number;

  @Column({ type: 'jsonb' })
  requestInput: Record<string, any>;

  @Column({ type: 'enum', enum: DecisionResult })
  decisionResult: DecisionResult;

  @Column({ type: 'text', nullable: true })
  decisionRationale: string;

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  evaluationTimeMs: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  evaluatedEntityType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  evaluatedEntityId: string;

  @Column({ type: 'uuid', nullable: true })
  actorId: string;

  @Column({ type: 'jsonb', default: '{}' })
  context: Record<string, any>;
}
