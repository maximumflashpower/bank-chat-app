import {
  Entity,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { PolicyDomain } from './policy-domain.enum';
import { PolicyLanguage } from './policy-language.enum';
import { PolicyStatus } from './policy-status.enum';
import { Severity } from './severity.enum';
import { EnforcementMode } from './enforcement-mode.enum';

@Entity({ name: 'gov_policies' })
export class GovPolicy extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: PolicyDomain })
  domain: PolicyDomain;

  @Column({ type: 'enum', enum: PolicyLanguage, default: PolicyLanguage.JSON_RULES })
  language: PolicyLanguage;

  @Column({ type: 'text' })
  codeContent: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'enum', enum: PolicyStatus, default: PolicyStatus.DRAFT })
  status: PolicyStatus;

  @Column({ type: 'enum', enum: Severity, default: Severity.MEDIUM })
  severity: Severity;

  @Column({ type: 'enum', enum: EnforcementMode, default: EnforcementMode.DRY_RUN })
  enforcementMode: EnforcementMode;

  @Column({ type: 'jsonb', default: '{}' })
  applicableScope: Record<string, any>;

  @Column({ type: 'uuid' })
  createdBy: string;
}
