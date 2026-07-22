import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('regulatory_stress_test')
export class RegulatoryStressTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  stressTestReference: string;

  @Column({ type: 'varchar', length: 100 })
  scenarioName: string;

  @Column({ type: 'varchar', length: 20 })
  scenarioType: string;

  @Column({ type: 'varchar', length: 20 })
  reportingCycle: string;

  @Column({ type: 'jsonb', nullable: true })
  macroAssumptionsJson: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  creditLossModelVersion: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  preProvisionNetRevenueProjected: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  creditLossesProjected: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  tradingLossesProjected: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  operationalLossesProjected: number;

  @Column({ type: 'jsonb', nullable: true })
  capitalRatiosProjectedJson: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  minimumCapitalThreshold: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  capitalBufferStress: number;

  @Column({ type: 'boolean', default: false })
  breachUnderStress: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  liquidityRatioStressed: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  nsfrStressed: number;

  @Column({ type: 'jsonb', nullable: true })
  modelVersioningJson: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  reproducibilityArtifactsUrl: string | null;

  @Column({ type: 'text', nullable: true })
  narrativeExplanation: string | null;

  @Column({ type: 'date', nullable: true })
  regulatorySubmissionDeadline: Date | null;

  @Column({ type: 'boolean', default: false })
  submittedToRegulator: boolean;

  @Column({ type: 'date', nullable: true })
  submissionDate: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'configured' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  executedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
