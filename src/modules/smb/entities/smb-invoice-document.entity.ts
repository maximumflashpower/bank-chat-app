import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { SmbContactParty } from './smb-contact-party.entity';

@Entity('smb_invoice_document')
export class SmbInvoiceDocument extends BaseEntity {
  @Column({ type: 'varchar', length: 50, nullable: false })
  invoiceNumber: string;

  @Column({ type: 'uuid', nullable: false })
  customerId: string;

  @Column({ type: 'date', nullable: false })
  issueDate: Date;

  @Column({ type: 'date', nullable: false })
  dueDate: Date;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  subtotalNetAmount: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  discountPercentageApplied?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  discountAbsoluteAmount?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  taxableBaseAmount: number;

  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: true })
  taxRateAppliedPercent?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  taxAmountCalculated: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  shippingHandlingFee?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  grandTotalAmountDue: number;

  @Column({ type: 'varchar', length: 3, nullable: false, default: 'USD' })
  currencyIsoCode: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'draft' })
  status: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  paidAmountTotalReceived?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  remainingBalanceOwed?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  lateFeePenaltyCharged?: number;

  @Column({ type: 'jsonb', nullable: true })
  paymentMethodAccepted?: any;

  @Column({ type: 'varchar', length: 100, nullable: true })
  templateLayoutDesignUsed?: string;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ type: 'int', nullable: false, default: 0 })
  viewTrackingCount: number;

  @Column({ type: 'boolean', nullable: false, default: false })
  archived: boolean;

  @Column({ type: 'uuid', nullable: false })
  createdByUserId: string;

  @ManyToOne(() => SmbContactParty)
  @JoinColumn({ name: 'customerId' })
  customer?: SmbContactParty;
}
