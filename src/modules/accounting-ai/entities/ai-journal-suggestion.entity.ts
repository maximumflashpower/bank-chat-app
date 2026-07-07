import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';
import { AiOcrExtractionTask } from './ai-ocr-extraction-task.entity';

@Entity('ai_journal_suggestion')
export class AiJournalSuggestion extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  sourceDocumentId: string;

  @Column({ type: 'jsonb', nullable: false })
  suggestedEntryJson: any;

  @Column({ type: 'jsonb', nullable: true })
  accountAssignments?: any;

  @Column({ type: 'text', array: true, nullable: true })
  classificationLabels?: string[];

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  mlConfidenceScore?: number;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'pending_approval' })
  status: string;

  @Column({ type: 'text', nullable: true })
  approverComments?: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  humanCorrectionApplied: boolean;

  @Column({ type: 'jsonb', nullable: true })
  correctedFields?: any;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  postedToLedgerId?: string;

  @Column({ type: 'text', nullable: true })
  rejectedReason?: string;

  @ManyToOne(() => AiOcrExtractionTask)
  @JoinColumn({ name: 'sourceDocumentId' })
  sourceDocument?: AiOcrExtractionTask;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'approvedBy' })
  approverUser?: IdentityUser;
}
