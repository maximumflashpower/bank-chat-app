import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('correspondent_bank')
export class CorrespondentBank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 11, unique: true })
  bankCodeSwift: string;

  @Column({ type: 'varchar', length: 255 })
  bankLegalName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  branchName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  headquartersCity: string;

  @Column({ type: 'varchar', length: 2 })
  headquartersCountry: string;

  @Column({ type: 'varchar', length: 3 })
  primaryCurrency: string;

  @Column({ type: 'text', array: true })
  supportedCurrencies: string[];

  @Column({ type: 'varchar', length: 20, default: 'active' })
  relationshipStatus: string;

  @Column({ type: 'date', nullable: true })
  onboardingDate: Date;

  @Column({ type: 'date', nullable: true })
  terminationDate: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  kycStatus: string;

  @Column({ type: 'timestamptz', nullable: true })
  kybDocumentationVerifiedAt: Date;

  @Column({ type: 'date', nullable: true })
  annualReviewDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastSanctionScreenDate: Date;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  riskScoreInternal: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  countryRiskRating: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  amlProgramGrade: string;

  @Column({ type: 'boolean', default: false })
  wolfsbergMember: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  correspondentType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactOperationsEmail: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactTreasuryPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactComplianceEmail: string;

  @Column({ type: 'jsonb', nullable: true })
  feeStructureJson: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  slaTargetTimesJson: Record<string, any>;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  maximumExposureUsd: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, default: 0 })
  currentExposureUsd: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
