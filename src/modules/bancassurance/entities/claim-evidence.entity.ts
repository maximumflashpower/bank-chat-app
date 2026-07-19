import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum EvidenceType {
  PHOTO = 'photo',
  VIDEO = 'video',
  DOCUMENT = 'document',
  RECEIPT = 'receipt',
  POLICE_REPORT = 'police_report',
  MEDICAL_RECORD = 'medical_record',
  ESTIMATE = 'estimate',
  OTHER = 'other',
}

@Entity('claim_evidence')
export class ClaimEvidence extends BaseEntity {
  @Column({ name: 'claim_id', type: 'uuid', nullable: false })
  claimId: string;

  @Column({ name: 'evidence_type', type: 'varchar', length: 30, nullable: false })
  evidenceType: EvidenceType;

  @Column({ name: 'file_path', type: 'varchar', length: 500, nullable: false })
  filePath: string;

  @Column({ name: 'file_hash', type: 'varchar', length: 128, nullable: true })
  fileHash: string | null;

  @Column({ name: 'file_size_bytes', type: 'bigint', nullable: true })
  fileSizeBytes: number | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy: string | null;
}
