// src/modules/loans/entities/loan-delinquency-event.entity.ts

import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';
import { DelinquencyEventType, CollectionAction, CustomerResponseStatus, HardshipProgram } from './loans.enums.js';

@Entity('loan_delinquency_event')
export class LoanDelinquencyEvent extends BaseEntity {
  @Column({ type: 'uuid', name: 'loan_id' })
  loanId: string;

  @Column({ type: 'varchar', length: 30, name: 'event_type' })
  eventType: DelinquencyEventType;

  @Column({ type: 'int', name: 'days_past_due_at_event', nullable: true })
  daysPastDueAtEvent: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'amount_past_due', nullable: true })
  amountPastDue: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'late_fee_charged', nullable: true })
  lateFeeCharged: number | null;

  @Column({ type: 'varchar', length: 50, name: 'collection_action_taken', nullable: true })
  collectionActionTaken: CollectionAction | null;

  @Column({ type: 'text', name: 'notification_sent_channels', nullable: true })
  notificationSentChannels: string[] | null;

  @Column({ type: 'varchar', length: 20, name: 'customer_response_status', nullable: true })
  customerResponseStatus: CustomerResponseStatus | null;

  @Column({ type: 'boolean', name: 'hardship_request_flag', default: false })
  hardshipRequestFlag: boolean;

  @Column({ type: 'varchar', length: 50, name: 'hardship_program_enrolled', nullable: true })
  hardshipProgramEnrolled: HardshipProgram | null;

  @Column({ type: 'boolean', name: 'credit_bureau_reported', default: false })
  creditBureauReported: boolean;

  @Column({ type: 'date', name: 'bureau_reported_date', nullable: true })
  bureauReportedDate: Date | null;

  @Column({ type: 'date', name: 'cured_at', nullable: true })
  curedAt: Date | null;

  @Column({ type: 'boolean', name: 'escalated_to_legal', default: false })
  escalatedToLegal: boolean;

  @Column({ type: 'varchar', length: 100, name: 'legal_case_reference', nullable: true })
  legalCaseReference: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'charge_off_amount', nullable: true })
  chargeOffAmount: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'recovery_amount', default: 0 })
  recoveryAmount: number;

  @Column({ type: 'timestamptz', name: 'event_timestamp', default: () => 'NOW()' })
  eventTimestamp: Date;
}
