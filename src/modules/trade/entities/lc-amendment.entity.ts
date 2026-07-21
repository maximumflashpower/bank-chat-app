import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { AmendmentType } from '../enums/amendment-type.enum';
import { AmendmentStatus } from '../enums/amendment-status.enum';

@Entity('lc_amendment')
export class LCAmendment extends BaseEntity {

  @Column({ type: 'varchar', length: 50 })
  lcReference: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  amendmentNumber: string;

  @Column({ type: 'date' })
  amendmentDate: Date;

  @Column({ type: 'enum', enum: AmendmentType })
  amendmentType: AmendmentType;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  oldAmount?: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  newAmount?: number;

  @Column({ type: 'date', nullable: true })
  oldExpiryDate?: Date;

  @Column({ type: 'date', nullable: true })
  newExpiryDate?: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  oldBeneficiaryName?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  newBeneficiaryName?: string;

  @Column({ type: 'text', nullable: true })
  additionalDocuments?: string;

  @Column({ type: 'text', nullable: true })
  removedDocuments?: string;

  @Column({ type: 'text', nullable: true })
  additionalConditions?: string;

  @Column({ type: 'text', nullable: true })
  amendedConditions?: string;

  @Column({ type: 'text', nullable: true })
  changeDescription: string;

  @Column({ type: 'enum', enum: AmendmentStatus, default: AmendmentStatus.PENDING })
  status: AmendmentStatus;

  @Column({ type: 'varchar', length: 200, nullable: true })
  beneficiaryConfirmationName?: string;

  @Column({ type: 'timestamp', nullable: true })
  beneficiaryConfirmedDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  advisingBankConfirmedDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  issuingBankApprovedDate?: Date;

  @Column({ type: 'integer', default: 0 })
  rejectionCount: number;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'boolean', default: false })
  requiresReconfirmation: boolean;


}
