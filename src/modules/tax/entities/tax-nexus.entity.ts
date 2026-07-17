import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NexusType {
  PHYSICAL = 'physical',
  ECONOMIC = 'economic',
  CLICKTHROUGH = 'clickthrough',
  MARKETPLACE = 'marketplace',
  AFFILIATE = 'affiliate',
  TEMPORARY = 'temporary',
}

export enum NexusStatus {
  ACTIVE = 'active',
  UNDER_REVIEW = 'under_review',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('tax_nexus')
export class TaxNexus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'entity_id', type: 'uuid', nullable: false })
  entityId: string;

  @Index()
  @Column({ name: 'jurisdiction_id', type: 'uuid', nullable: false })
  jurisdictionId: string;

  @Column({ name: 'nexus_type', type: 'varchar', length: 20 })
  nexusType: NexusType;

  @Column({ name: 'established_date', type: 'date', nullable: false })
  establishedDate: Date;

  @Column({ name: 'effective_date', type: 'date', nullable: false })
  effectiveDate: Date;

  @Column({ name: 'termination_date', type: 'date', nullable: true })
  terminationDate: Date | null;

  @Column({ name: 'physical_location', type: 'varchar', length: 255, nullable: true })
  physicalLocation: string;

  @Column({ name: 'physical_address_line_1', type: 'varchar', length: 255, nullable: true })
  physicalAddressLine1: string | null;

  @Column({ name: 'physical_address_line_2', type: 'varchar', length: 255, nullable: true })
  physicalAddressLine2: string | null;

  @Column({ name: 'city', type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ name: 'state_province', type: 'varchar', length: 100, nullable: true })
  stateProvince: string | null;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @Column({ name: 'country_code', type: 'varchar', length: 2, default: 'US' })
  countryCode: string;

  @Column({ name: 'has_physical_presence', type: 'boolean', default: false })
  hasPhysicalPresence: boolean;

  @Column({ name: 'employees_in_jurisdiction', type: 'int', default: 0 })
  employeesInJurisdiction: number;

  @Column({ name: 'property_value', type: 'numeric', precision: 18, scale: 2, default: 0 })
  propertyValue: number;

  @Column({ name: 'payroll_expense', type: 'numeric', precision: 18, scale: 2, default: 0 })
  payrollExpense: number;

  @Column({ name: 'sales_revenue_12m', type: 'numeric', precision: 18, scale: 2, default: 0 })
  salesRevenue12m: number;

  @Column({ name: 'transactions_count_12m', type: 'int', default: 0 })
  transactionsCount12m: number;

  @Column({ name: 'economic_threshold_met', type: 'boolean', default: false })
  economicThresholdMet: boolean;

  @Column({ name: 'threshold_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  thresholdAmount: number | null;

  @Column({ name: 'threshold_type', type: 'varchar', length: 20, nullable: true })
  thresholdType: string;

  @Column({ name: 'registration_required', type: 'boolean', default: true })
  registrationRequired: boolean;

  @Column({ name: 'registered', type: 'boolean', default: false })
  registered: boolean;

  @Column({ name: 'registration_number', type: 'varchar', length: 100, nullable: true })
  registrationNumber: string | null;

  @Column({ name: 'filing_frequency', type: 'varchar', length: 20, nullable: true })
  filingFrequency: string;

  @Column({ name: 'next_filing_due', type: 'date', nullable: true })
  nextFilingDue: Date | null;

  @Column({ name: 'last_audit_date', type: 'date', nullable: true })
  lastAuditDate: Date | null;

  @Column({ name: 'compliance_status', type: 'varchar', length: 20, default: 'compliant' })
  complianceStatus: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: NexusStatus;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
