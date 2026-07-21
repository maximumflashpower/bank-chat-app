import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { LCStatus } from '../enums/lc-status.enum';
import { RiskLevel } from '../enums/risk-level.enum';

@Entity('letter_of_credit')
export class LetterOfCredit extends BaseEntity {

  @Column({ type: 'varchar', length: 50, unique: true })
  lcNumber: string;

  @Column({ type: 'varchar', length: 20 })
  applicationNumber: string;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date' })
  expiryDate: Date;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 200 })
  applicantName: string;

  @Column({ type: 'varchar', length: 200 })
  beneficiaryName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  beneficiaryBankName?: string;

  @Column({ type: 'varchar', length: 11, nullable: true })
  beneficiarySwiftCode?: string;

  @Column({ type: 'varchar', length: 50 })
  issuingCountry: string;

  @Column({ type: 'varchar', length: 50 })
  countryOfOrigin: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  shipmentDestination?: string;

  @Column({ type: 'enum', enum: LCStatus, default: LCStatus.ISSUED })
  status: LCStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lcType?: string;

  @Column({ type: 'boolean', default: false })
  confirmed: boolean;

  @Column({ type: 'boolean', default: false })
  revolving: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  advisingBankName?: string;

  @Column({ type: 'varchar', length: 11, nullable: true })
  advisingSwiftCode?: string;

  @Column({ type: 'text', nullable: true })
  specialConditions?: string;

  @Column({ type: 'text', nullable: true })
  requiredDocuments?: string[];

  @Column({ type: 'enum', enum: RiskLevel, default: RiskLevel.LOW })
  riskLevel: RiskLevel;

  @Column({ type: 'integer', default: 1 })
  revisionCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAmendmentDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryNotificationDate?: Date;

  @Column({ type: 'boolean', default: false })
  autoRenewal: boolean;

  @Column({ type: 'integer', nullable: true })
  tenorDays?: number;


}
