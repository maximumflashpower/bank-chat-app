import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { GuaranteeType } from '../enums/guarantee-type.enum';
import { GuaranteeStatus } from '../enums/guarantee-status.enum';
import { RiskLevel } from '../enums/risk-level.enum';

@Entity('bank_guarantee')
export class BankGuarantee extends BaseEntity {

  @Column({ type: 'varchar', length: 50, unique: true })
  guaranteeNumber: string;

  @Column({ type: 'varchar', length: 50 })
  applicationNumber: string;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date' })
  expiryDate: Date;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  claimAmount: number;

  @Column({ type: 'varchar', length: 200 })
  applicantName: string;

  @Column({ type: 'varchar', length: 200 })
  beneficiaryName: string;

  @Column({ type: 'varchar', length: 200 })
  beneficiaryBankName: string;

  @Column({ type: 'varchar', length: 11 })
  beneficiarySwiftCode: string;

  @Column({ type: 'varchar', length: 50 })
  issuingCountry: string;

  @Column({ type: 'enum', enum: GuaranteeType })
  guaranteeType: GuaranteeType;

  @Column({ type: 'enum', enum: GuaranteeStatus, default: GuaranteeStatus.ACTIVE })
  status: GuaranteeStatus;

  @Column({ type: 'text', nullable: true })
  purposeDescription?: string;

  @Column({ type: 'boolean', default: false })
  callable: boolean;

  @Column({ type: 'boolean', default: false })
  counterGuarantee: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  counterGuarantorName?: string;

  @Column({ type: 'text', nullable: true })
  specialTerms?: string;

  @Column({ type: 'text', nullable: true })
  claimHistory?: string[];

  @Column({ type: 'enum', enum: RiskLevel, default: RiskLevel.MEDIUM })
  riskLevel: RiskLevel;

  @Column({ type: 'timestamp', nullable: true })
  lastClaimDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryNotificationDate?: Date;

  @Column({ type: 'boolean', default: false })
  extended: boolean;

  @Column({ type: 'integer', default: 1 })
  revisionCount: number;


}
