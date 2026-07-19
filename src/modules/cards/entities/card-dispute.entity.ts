import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum DisputeStatus {
  OPENED = 'opened',
  UNDER_INVESTIGATION = 'under_investigation',
  RESOLVED = 'resolved',
  INVALID = 'invalid',
  WON = 'won',
  LOST = 'lost',
}

export enum DisputeType {
  FRAUD_UNAUTHORIZED = 'fraud_unauthorized',
  PRODUCT_NOT_RECEIVED = 'product_not_received',
 PRODUCT_DEFECTIVE = 'product_defective',
  DUPLICATE_CHARGE = 'duplicate_charge',
  WRONG_AMOUNT = 'wrong_amount',
  CREDIT_NOT_PROCESSED = 'credit_not_processed',
  OTHER = 'other',
}

@Entity('card_dispute')
export class CardDispute extends BaseEntity {
  @Column({ name: 'card_id', type: 'uuid', nullable: false })
  cardId: string;

  @Column({ name: 'transaction_id', type: 'uuid', nullable: false })
  transactionId: string;

  @Column({ name: 'dispute_number', type: 'varchar', length: 50, unique: true, nullable: false })
  disputeNumber: string;

  @Column({ name: 'dispute_type', type: 'varchar', length: 50, nullable: false })
  disputeType: DisputeType;

  @Column({ name: 'dispute_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  disputeAmount: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: DisputeStatus.OPENED })
  status: DisputeStatus;

  @Column({ name: 'description', type: 'text', nullable: false })
  description: string;

  @Column({ name: 'evidence_documents', type: 'text', array: true, default: '{}' })
  evidenceDocuments: string[];

  @Column({ name: 'merchant_response', type: 'text', nullable: true })
  merchantResponse: string | null;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string | null;

  @Column({ name: 'charged_back', type: 'boolean', default: false })
  chargedBack: boolean;

  @Column({ name: 'chargeback_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  chargebackAmount: number | null;

  @Column({ name: 'investigated_by', type: 'uuid', nullable: true })
  investigatedBy: string | null;

  @Column({ name: 'opened_at', type: 'timestamptz', nullable: false })
  openedAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
