import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LiquidityRatioType, StressScenarioSeverity } from './capital-liquidity-status.enum';

@Entity('liquidity_ratios')
export class LiquidityRatio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  calculationReference: string;

  @Column({ type: 'date' })
  reportingDate: Date;

  @Column({ type: 'enum', enum: LiquidityRatioType })
  ratioType: LiquidityRatioType;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  numeratorAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  denominatorAmount: number;

  @Column({ type: 'numeric', precision: 8, scale: 4 })
  calculatedRatio: number;

  @Column({ type: 'numeric', precision: 8, scale: 4 })
  minimumRequirement: number;

  @Column({ type: 'numeric', precision: 8, scale: 4 })
  surplusAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  inflowsBreakdown?: {
    category: string;
    amount: number;
    haircutsApplied: number;
    netInflow: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  outflowsBreakdown?: {
    category: string;
    amount: number;
    stressFactor: number;
    stressedOutflow: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  hqlaComposition?: {
    level: string;
    assetType: string;
    amount: number;
    haircutsApplied: number;
    adjustedAmount: number;
  }[];

  @Column({ type: 'enum', enum: StressScenarioSeverity, nullable: true })
  stressScenario?: StressScenarioSeverity;

  @Column({ type: 'boolean', default: false })
  isStressTestResult: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  stressTestId?: string;

  @Column({ type: 'uuid' })
  calculatedByUserId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
