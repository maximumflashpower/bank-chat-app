import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { ForensicCaseStatus } from './forensic-case-status.enum';
import { ForensicSeverity } from './forensic-severity.enum';

@Entity({ name: 'forensic_cases' })
export class ForensicCase extends BaseEntity {
  @ApiProperty({ example: 'FC-2026-001' })
  @Index({ unique: true })
  @Column({ name: 'case_number', type: 'varchar', length: 50, unique: true })
  caseNumber: string;

  @ApiProperty({ example: 'Unauthorized access to admin panel' })
  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ enum: ForensicSeverity })
  @Column({ name: 'severity', type: 'enum', enum: ForensicSeverity })
  severity: ForensicSeverity;

  @ApiProperty({ enum: ForensicCaseStatus, default: ForensicCaseStatus.OPEN })
  @Column({ name: 'status', type: 'enum', enum: ForensicCaseStatus, default: ForensicCaseStatus.OPEN })
  status: ForensicCaseStatus;

  @ApiProperty({ nullable: true })
  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ type: () => String })
  @Column({ name: 'started_by', type: 'uuid' })
  startedBy: string;

  @ApiProperty({ nullable: true })
  @Column({ name: 'estimated_resolution', type: 'timestamptz', nullable: true })
  estimatedResolution: Date | null;

  @ApiProperty({ nullable: true })
  @Column({ name: 'regulatory_deadline', type: 'timestamptz', nullable: true })
  regulatoryDeadline: Date | null;

  @Column({ name: 'affected_users', type: 'uuid', array: true, default: '{}' })
  affectedUsers: string[];

  @Column({ name: 'evidence_count', type: 'int', default: 0 })
  evidenceCount: number;

  @ApiProperty({ nullable: true })
  @Column({ name: 'report_generated_at', type: 'timestamptz', nullable: true })
  reportGeneratedAt: Date | null;
}
