import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('pay_reconciliation_entry')
export class PayReconciliationEntry extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  bankStatementLineId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  statementReferenceNumber?: string;

  @Column({ type: 'date', nullable: false })
  statementDate: Date;

  @Column({ type: 'char', length: 1, nullable: false })
  statementDebitCredit: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  statementAmountLocal?: number;

  @Column({ type: 'uuid', array: true, nullable: true })
  matchedInstructionIds?: string[];

  @Column({ type: 'uuid', nullable: true })
  matchedCustomerId?: string;

  @Column({ type: 'text', array: true, nullable: true })
  matchedInvoiceNumbers?: string[];

  @Column({ type: 'numeric', precision: 6, scale: 2, array: true, nullable: true })
  allocationPercentages?: number[];

  @Column({ type: 'boolean', nullable: false, default: false })
  partialPaymentFlag: boolean;

  @Column({ type: 'boolean', nullable: false, default: false })
  disputeIdentifiedFlag: boolean;

  @Column({ type: 'boolean', nullable: false, default: false })
  holdUntilResolution: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  autoMatched: boolean;

  @Column({ type: 'uuid', nullable: true })
  manuallyAdjustedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  adjustedAt?: Date;

  @Column({ type: 'boolean', nullable: false, default: false })
  clearedTransitAccount: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  postedToLedgerAt?: Date;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'manuallyAdjustedBy' })
  manuallyAdjustedByUser?: IdentityUser;
}
