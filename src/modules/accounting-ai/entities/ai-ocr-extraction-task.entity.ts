import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('ai_ocr_extraction_task')
export class AiOcrExtractionTask extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  documentId: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  documentType: string;

  @Column({ type: 'text', nullable: false })
  fileStorageUrl: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'pending' })
  extractionStatus: string;

  @Column({ type: 'jsonb', nullable: true })
  extractedDataJson?: any;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendorDetectedName?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  amountTotalExtracted?: number;

  @Column({ type: 'date', nullable: true })
  dateInvoiceExtracted?: Date;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  taxAmountExtracted?: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  confidenceScore?: number;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ type: 'int', nullable: true })
  processingTimeMs?: number;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'reviewedBy' })
  reviewedByUser?: IdentityUser;
}
