import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  CapitalRatioType,
  CapitalAdequacyStatus,
  BufferType,
  ICAAPStatus,
} from './capital-liquidity-status.enum';

@Entity('capital_ratios')
export class CapitalRatio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  calculationReference: string;

  @Column({ type: 'date' })
  reportingDate: Date;

  @Column({ type: 'enum', enum: CapitalRatioType })
  ratioType: CapitalRatioType;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  capitalAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  riskWeightedAssets: number;

  @Column({ type: 'numeric', precision: 8, scale: 4 })
  calculatedRatio: number;

  @Column({ type: 'numeric', precision: 8, scale: 4 })
  minimumRequirement: number;

  @Column({ type: 'numeric', precision: 8, scale: 4, default: 0 })
  bufferRequirement: number;

  @Column({ type: 'numeric', precision: 8, scale: 4, default: 0 })
  totalRequirement: number;

  @Column({ type: 'enum', enum: CapitalAdequacyStatus, default: CapitalAdequacyStatus.COMPLIANT })
  adequacyStatus: CapitalAdequacyStatus;

  @Column({ type: 'numeric', precision: 8, scale: 4, default: 0 })
  surplusAboveMinimum: number;

  @Column({ type: 'numeric', precision: 8, scale: 4, default: 0 })
  surplusAboveBuffer: number;

  @Column({ type: 'jsonb', nullable: true })
  bufferBreakdown?: {
    bufferType: BufferType;
    amount: number;
    requirement: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  riskWeightDistribution?: {
    bucket: string;
    exposureAmount: number;
    riskWeight: string;
  }[];

  @Column({ type: 'uuid', nullable: true })
  icaapAssessmentId?: string;

  @Column({ type: 'enum', enum: ICAAPStatus, nullable: true })
  icaapStatus?: ICAAPStatus;

  @Column({ type: 'text', nullable: true })
  supervisorComment?: string;

  @Column({ type: 'timestamptz', nullable: true })
  supervisorReviewedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  supervisorReviewerId?: string;

  @Column({ type: 'uuid' })
  calculatedByUserId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
