import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { FrameworkName } from './framework-name.enum';
import { FrameworkStatus } from './framework-status.enum';

@Entity({ name: 'gov_framework_mappings' })
export class GovFrameworkMapping extends BaseEntity {
  @Column({ type: 'enum', enum: FrameworkName })
  frameworkName: FrameworkName;

  @Column({ type: 'varchar', length: 100 })
  frameworkControl: string;

  @Index()
  @Column({ type: 'uuid' })
  policyId: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 100.0 })
  coveragePct: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastAssessed: Date;

  @Column({ type: 'text', nullable: true })
  evidenceArtifact: string;

  @Column({ type: 'uuid', nullable: true })
  assessorId: string;

  @Column({ type: 'enum', enum: FrameworkStatus, default: FrameworkStatus.COMPLIANT })
  status: FrameworkStatus;
}
