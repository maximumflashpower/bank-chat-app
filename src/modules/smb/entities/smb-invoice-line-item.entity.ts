import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { SmbInvoiceDocument } from './smb-invoice-document.entity';

@Entity('smb_invoice_line_item')
export class SmbInvoiceLineItem extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  invoiceId: string;

  @Column({ type: 'uuid', nullable: false })
  inventoryItemId: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  sku: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  itemName?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  quantity: number;

  @Column({ type: 'numeric', precision: 18, scale: 6, nullable: false })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  lineSubtotal: number;

  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: true })
  taxRate?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  taxAmount?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  lineTotal: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxCategory?: string;

  @Column({ type: 'uuid', nullable: true })
  stockMovementId?: string;

  @Column({ type: 'uuid', nullable: true })
  taxCalculationResultId?: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  sortOrder: number;

  @ManyToOne(() => SmbInvoiceDocument)
  @JoinColumn({ name: 'invoiceId' })
  invoice?: SmbInvoiceDocument;
}
