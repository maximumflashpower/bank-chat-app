import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { ViolationStatus } from './violation-status.enum';
import { Severity } from './severity.enum';

@Entity({ name: 'gov_violations' })
export class GovViolation extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  policyId: string;

  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @Column({ type: 'varchar', length: 255 })
  entityId: string;

  @Column({ type: 'text' })
  violationDetail: string;

  @Column({ type: 'enum', enum: Severity })
  severity: Severity;

  @Column({ type: 'enum', enum: ViolationStatus, default: ViolationStatus.OPEN })
  status: ViolationStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedTo: string;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ type: 'text', nullable: true })
  waivedJustification: string;

  @Column({ type: 'timestamptz', nullable: true })
  waiverExpiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date;
}
