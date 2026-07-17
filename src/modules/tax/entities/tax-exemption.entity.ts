import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ExemptionType {
  NON_PROFIT = 'non_profit',
  GOVERNMENT = 'government',
  FOREIGN_ENTITY = 'foreign_entity',
  INTERSTATE_SALES = 'interstate_sales',
  RETAILER_EXEMPTION = 'retailer_exemption',
  MANUFACTURER_EXEMPTION = 'manufacturer_exemption',
  OTHER = 'other',
}

export enum ExemptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  DENIED = 'denied',
}

@Entity('tax_exemptions')
export class TaxExemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'exemption_code', type: 'varchar', length: 50, unique: true })
  exemptionCode: string;

  @Column({ name: 'certificate_number', type: 'varchar', length: 100 })
  certificateNumber: string;

  @Column({ name: 'exemption_type', type: 'varchar', length: 30 })
  exemptionType: ExemptionType;

  @Column({ name: 'entity_id', type: 'uuid', nullable: false })
  entityId: string;

  @Column({ name: 'entity_name', type: 'varchar', length: 255 })
  entityName: string;

  @Column({ name: 'jurisdiction_id', type: 'uuid', nullable: false })
  jurisdictionId: string;

  @Column({ name: 'issue_date', type: 'date', nullable: false })
  issueDate: Date;

  @Column({ name: 'expiration_date', type: 'date', nullable: false })
  expirationDate: Date;

  @Column({ name: 'issuing_authority', type: 'varchar', length: 255 })
  issuingAuthority: string;

  @Column({ name: 'coverage_scope', type: 'text', nullable: true })
  coverageScope: string;

  @Column({ name: 'eligible_tax_types', type: 'text', array: true, nullable: true })
  eligibleTaxTypes: string[];

  @Column({ name: 'coverage_percentage', type: 'numeric', precision: 5, scale: 2, default: 100 })
  coveragePercentage: number;

  @Column({ name: 'conditions', type: 'text', nullable: true })
  conditions: string | null;

  @Column({ name: 'certificate_document_url', type: 'varchar', length: 500, nullable: true })
  certificateDocumentUrl: string;

  @Column({ name: 'verified', type: 'boolean', default: false })
  verified: boolean;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy: string;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: ExemptionStatus;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
