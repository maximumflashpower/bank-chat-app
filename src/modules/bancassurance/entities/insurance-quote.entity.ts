import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum QuoteStatus {
  QUOTED = 'quoted',
  EXPIRED = 'expired',
  CONVERTED = 'converted',
  DECLINED = 'declined',
}

@Entity('insurance_quotes')
export class InsuranceQuote extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ name: 'product_id', type: 'integer', nullable: false })
  productId: number;

  @Column({ name: 'risk_data', type: 'jsonb', nullable: false })
  riskData: Record<string, any>;

  @Column({ name: 'coverage_level', type: 'varchar', length: 30, nullable: false })
  coverageLevel: string;

  @Column({ name: 'quoted_premium', type: 'numeric', precision: 18, scale: 2, nullable: false })
  quotedPremium: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, nullable: false })
  currency: string;

  @Column({ name: 'deductible', type: 'numeric', precision: 18, scale: 2, nullable: true })
  deductible: number | null;

  @Column({ name: 'coverage_limits', type: 'jsonb', nullable: true })
  coverageLimits: Record<string, any> | null;

  @Column({ name: 'valid_until', type: 'timestamp', nullable: true })
  validUntil: Date | null;

  @Column({ type: 'varchar', length: 20, default: QuoteStatus.QUOTED })
  status: QuoteStatus;
}
