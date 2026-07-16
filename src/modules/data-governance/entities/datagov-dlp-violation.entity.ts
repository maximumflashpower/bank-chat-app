import { Entity, Column, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { DlpSeverity } from './datagov-dlp-rule.entity';

@Entity('datagov_dlp_violation')
export class DatagovDlpViolation extends BaseEntity {
  @Column({ name: 'rule_id', type: 'uuid', nullable: false })
  ruleId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  channel: string;

  @Column({ name: 'attempted_action', type: 'varchar', length: 50, nullable: false })
  attemptedAction: string;

  @Column({ type: 'boolean', nullable: false })
  blocked: boolean;

  @Column({ name: 'content_snippet_masked', type: 'text', nullable: true })
  contentSnippetMasked: string | null;

  @Column({ type: 'text', nullable: true })
  justification: string | null;

  @Column({ name: 'approval_id', type: 'uuid', nullable: true })
  approvalId: string | null;

  @Column({ type: 'varchar', length: 10, default: 'medium' })
  severity: DlpSeverity;

  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @CreateDateColumn({ name: 'detected_at', type: 'timestamptz' })
  detectedAt: Date;
}
