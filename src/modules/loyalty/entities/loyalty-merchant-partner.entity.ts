import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum MerchantCategory {
  RETAIL = 'retail',
  DINING = 'dining',
  TRAVEL = 'travel',
  GAS = 'gas',
  GROCERY = 'grocery',
  ENTERTAINMENT = 'entertainment',
  HEALTH = 'health',
  AUTOMOTIVE = 'automotive',
  ONLINE = 'online',
  OTHER = 'other',
}

export enum PartnerStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
}

@Entity('loyalty_merchant_partner')
export class LoyaltyMerchantPartner extends BaseEntity {
  @Column({ name: 'program_id', type: 'uuid', nullable: false })
  programId: string;

  @Column({ name: 'merchant_code', type: 'varchar', length: 50, nullable: false })
  merchantCode: string;

  @Column({ name: 'merchant_name', type: 'varchar', length: 200, nullable: false })
  merchantName: string;

  @Column({ name: 'merchant_category', type: 'varchar', length: 30, nullable: false })
  merchantCategory: MerchantCategory;

  @Column({ name: 'legal_name', type: 'varchar', length: 255, nullable: true })
  legalName: string | null;

  @Column({ name: 'tax_id', type: 'varchar', length: 50, nullable: true })
  taxId: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 30, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'website_url', type: 'varchar', length: 500, nullable: true })
  websiteUrl: string | null;

  @Column({ name: 'address_line1', type: 'varchar', length: 255, nullable: true })
  addressLine1: string | null;

  @Column({ name: 'address_city', type: 'varchar', length: 100, nullable: true })
  addressCity: string | null;

  @Column({ name: 'address_country', type: 'varchar', length: 2, nullable: true })
  addressCountry: string | null;

  @Column({ name: 'commission_rate', type: 'numeric', precision: 5, scale: 2, default: 0 })
  commissionRate: number;

  @Column({ name: 'earning_multiplier', type: 'numeric', precision: 5, scale: 2, default: 1 })
  earningMultiplier: number;

  @Column({ name: 'settlement_frequency', type: 'varchar', length: 20, default: 'monthly' })
  settlementFrequency: string;

  @Column({ name: 'last_settlement_date', type: 'date', nullable: true })
  lastSettlementDate: Date | null;

  @Column({ name: 'total_points_generated', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalPointsGenerated: number;

  @Column({ name: 'total_commission_accrued', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalCommissionAccrued: number;

  @Column({ name: 'contract_start_date', type: 'date', nullable: true })
  contractStartDate: Date | null;

  @Column({ name: 'contract_end_date', type: 'date', nullable: true })
  contractEndDate: Date | null;

  @Column({ type: 'varchar', length: 20, default: PartnerStatus.PENDING })
  status: PartnerStatus;

  @Column({ name: 'registered_by', type: 'uuid', nullable: false })
  registeredBy: string;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: Record<string, any> | null;
}
