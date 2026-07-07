import {
  Entity,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

@Entity('smb_contact_party')
export class SmbContactParty extends BaseEntity {
  @Column({ type: 'varchar', length: 10, nullable: false })
  partyType: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  companyLegalName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  individualFullName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxIdNumber?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  primaryPhone?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  secondaryPhone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailAddress?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  billingAddressLine1?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  billingAddressCity?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  billingStateProvince?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  billingPostalCode?: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  billingCountryIso?: string;

  @Column({ type: 'int', nullable: false, default: 30 })
  paymentTermsDaysDefault: number;

  @Column({ type: 'varchar', length: 3, nullable: false, default: 'USD' })
  currencyPreference: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  creditLimitAssigned?: number;

  @Column({ type: 'boolean', nullable: false, default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  lastInvoiceDate?: Date;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  outstandingBalanceAmount?: number;

  @Column({ type: 'text', nullable: true })
  notesInternalFreeform?: string;
}
