import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ReportType,
  ReportingPeriodType,
  RegulatoryAuthority,
  FilingFormat,
  ReportStatus,
  FilingStatus,
  SubmissionMethod,
} from './call-report-status.enum';

@Entity('regulatory_reports')
export class RegulatoryReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  reportReference: string;

  @Column({ type: 'enum', enum: ReportType })
  reportType: ReportType;

  @Column({ type: 'enum', enum: ReportingPeriodType })
  reportingPeriodType: ReportingPeriodType;

  @Column({ type: 'date' })
  reportingPeriodStart: Date;

  @Column({ type: 'date' })
  reportingPeriodEnd: Date;

  @Column({ type: 'enum', enum: RegulatoryAuthority })
  regulatoryAuthority: RegulatoryAuthority;

  @Column({ type: 'enum', enum: FilingFormat })
  filingFormat: FilingFormat;

  @Column({ type: 'jsonb', nullable: true })
  dataSources?: Record<string, unknown>[];

  @Column({ type: 'jsonb', nullable: true })
  lineageMetadata?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  calculationFormulasApplied?: Record<string, unknown>[];

  @Column({ type: 'text', nullable: true })
  reportFileUrl?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  reportFileHashChecksum?: string;

  @Column({ type: 'jsonb', nullable: true })
  validationErrors?: Record<string, unknown>[];

  @Column({ type: 'jsonb', nullable: true })
  validationWarnings?: Record<string, unknown>[];

  @Column({ type: 'boolean', default: false })
  validationPassed: boolean;

  @Column({ type: 'uuid', nullable: true })
  preparedByUserId?: string;

  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId?: string;

  @Column({ type: 'uuid', nullable: true })
  approvedByUserId?: string;

  @Column({ type: 'enum', enum: SubmissionMethod, nullable: true })
  submissionMethod?: SubmissionMethod;

  @Column({ type: 'varchar', length: 100, nullable: true })
  submissionPortalReference?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  filingAcknowledgementNumber?: string;

  @Column({ type: 'timestamptz', nullable: true })
  filingAcknowledgementReceivedAt?: Date;

  @Column({ type: 'enum', enum: FilingStatus, default: FilingStatus.DRAFT })
  filingStatus: FilingStatus;

  @Column({ type: 'date' })
  filingDeadline: Date;

  @Column({ type: 'boolean', default: false })
  lateFiling: boolean;

  @Column({ type: 'uuid', nullable: true })
  amendmentOriginalId?: string;

  @Column({ type: 'int', default: 0 })
  amendmentCount: number;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.GENERATING })
  status: ReportStatus;

  @Column({ type: 'timestamptz', nullable: true })
  generatedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
