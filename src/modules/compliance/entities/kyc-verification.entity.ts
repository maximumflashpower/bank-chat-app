import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DocumentType } from './document-type.enum';
import { RiskLevel } from './risk-level.enum';
import { VerificationStatus } from './verification-status.enum';

@Entity('kyc_verifications')
export class KycVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'document_type', type: 'varchar', length: 50 })
  documentType: DocumentType;

  @Column({ name: 'document_number', type: 'varchar', length: 100, nullable: true })
  documentNumber: string;

  @Column({ name: 'document_country', type: 'varchar', length: 2, nullable: true })
  documentCountry: string;

  @Column({ name: 'ocr_confidence', type: 'numeric', precision: 5, scale: 2, nullable: true })
  ocrConfidence: number;

  @Column({ name: 'liveness_passed', type: 'boolean', default: false })
  livenessPassed: boolean;

  @Column({ name: 'face_match_score', type: 'numeric', precision: 5, scale: 2, nullable: true })
  faceMatchScore: number;

  @Column({ name: 'risk_level', type: 'varchar', length: 10, default: RiskLevel.PENDING })
  riskLevel: RiskLevel;

  @Column({ name: 'risk_score', type: 'numeric', precision: 4, scale: 2, default: 0 })
  riskScore: number;

  @Column({ name: 'verification_status', type: 'varchar', length: 20, default: VerificationStatus.PENDING })
  verificationStatus: VerificationStatus;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
