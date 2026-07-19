import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum PositivePayStatus {
  ISSUED = 'issued',
  PAID = 'paid',
  RETURNED = 'returned',
  VOID = 'void',
  STALE = 'stale',
}

export enum MatchResult {
  EXACT = 'exact',
  MISMATCH_AMOUNT = 'mismatch_amount',
  MISMATCH_PAYEE = 'mismatch_payee',
  NOT_LISTED = 'not_listed',
}

export enum PositivePayDecision {
  PENDING = 'pending',
  PAY = 'pay',
  RETURN = 'return',
  INVESTIGATE = 'investigate',
}

@Entity('business_positive_pay_record')
export class BusinessPositivePayRecord extends BaseEntity {
  @Column({ name: 'account_id', type: 'uuid', nullable: false })
  accountId: string;

  @Column({ name: 'check_number', type: 'varchar', length: 50, nullable: false })
  checkNumber: string;

  @Column({ name: 'check_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  checkAmount: number;

  @Column({ name: 'payee_name', type: 'varchar', length: 255, nullable: false })
  payeeName: string;

  @Column({ name: 'issue_date', type: 'date', nullable: false })
  issueDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'issued' })
  status: PositivePayStatus;

  @Column({ name: 'presented_check_number', type: 'varchar', length: 50, nullable: true })
  presentedCheckNumber: string | null;

  @Column({ name: 'presented_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  presentedAmount: number | null;

  @Column({ name: 'presented_payee', type: 'varchar', length: 255, nullable: true })
  presentedPayee: string | null;

  @Column({ name: 'match_result', type: 'varchar', length: 20, nullable: true })
  matchResult: MatchResult | null;

  @Column({ name: 'decision', type: 'varchar', length: 20, default: 'pending' })
  decision: PositivePayDecision;

  @Column({ name: 'decided_by', type: 'uuid', nullable: true })
  decidedBy: string | null;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @Column({ name: 'uploaded_at', type: 'timestamptz', nullable: true })
  uploadedAt: Date | null;
}
