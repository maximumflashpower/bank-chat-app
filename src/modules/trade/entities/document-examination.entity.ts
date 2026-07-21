import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { ExaminationResult } from '../enums/examination-result.enum';
import { DocumentType } from '../enums/document-type.enum';

@Entity('document_examination')
export class DocumentExamination extends BaseEntity {

  @Column({ type: 'varchar', length: 50 })
  lcOrGuaranteeRef: string;

  @Column({ type: 'varchar', length: 50 })
  documentNumber: string;

  @Column({ type: 'enum', enum: DocumentType })
  documentType: DocumentType;

  @Column({ type: 'varchar', length: 200 })
  documentTitle: string;

  @Column({ type: 'date' })
  presentationDate: Date;

  @Column({ type: 'date', nullable: true })
  documentDate?: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  issuerName?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  consigneeName?: string;

  @Column({ type: 'text', nullable: true })
  discrepancyNotes?: string;

  @Column({ type: 'enum', enum: ExaminationResult })
  examinationResult: ExaminationResult;

  @Column({ type: 'varchar', length: 200, nullable: true })
  examinerName?: string;

  @Column({ type: 'timestamp', nullable: true })
  examinationDate?: Date;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ type: 'integer', default: 0 })
  discrepancyCount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  complianceStandard?: string;

  @Column({ type: 'boolean', default: false })
  waived: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  waiverReason?: string;

  @Column({ type: 'boolean', default: false })
  urgentProcessing: boolean;

  @Column({ type: 'integer', nullable: true })
  processingTimeHours?: number;


}
