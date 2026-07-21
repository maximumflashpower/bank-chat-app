import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum ScoreGrade {
  EXCELLENT = 'A',
  GOOD = 'B',
  FAIR = 'C',
  POOR = 'D',
  VERY_POOR = 'F',
}

export enum RiskBand {
  PRIME = 'prime',
  NEAR_PRIME = 'near_prime',
  SUBPRIME = 'subprime',
  DEEP_SUBPRIME = 'deep_subprime',
}

@Entity('credit_scores')
@Index(['userId'])
export class CreditScore extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'varchar', length: 10, name: 'score_grade' })
  scoreGrade: ScoreGrade;

  @Column({ type: 'int', nullable: true, name: 'bureau_score' })
  bureauScore?: number;

  @Column({ type: 'int', nullable: true, name: 'internal_score' })
  internalScore?: number;

  @Column({ type: 'int', nullable: true, name: 'alt_data_score' })
  altDataScore?: number;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'risk_band' })
  riskBand?: RiskBand;

  @Column({ type: 'jsonb', default: '{}' })
  factors: Record<string, any>;

  @Column({ type: 'timestamptz', name: 'calculated_at' })
  calculatedAt: Date;
}
