import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('reg_ethics_cases')
export class EthicsCase extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 30 })
  caseType: string;

  @Column({ type: 'boolean', default: false })
  anonymousReport: boolean;

  @Column({ type: 'text', nullable: true })
  reporterEncryptedId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 10 })
  severity: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  assignedInvestigator: string;

  @Column({ type: 'timestamptz', nullable: true })
  investigationDeadline: Date;

  @Column({ type: 'simple-array', nullable: true })
  evidenceAttachments: string[];

  @Column({ type: 'varchar', length: 10, default: 'confidential' })
  confidentialityLevel: string;

  @Column({ type: 'text', nullable: true })
  resolutionSummary: string;

  @Column({ type: 'boolean', default: false })
  rewardEligible: boolean;

  @Column({ type: 'text', nullable: true })
  rewardAssessment: string;
}
