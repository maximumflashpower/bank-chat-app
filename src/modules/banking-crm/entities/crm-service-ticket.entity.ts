import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum TicketCategory {
  ACCOUNT_ISSUE = 'account_issue',
  CARD_PROBLEM = 'card_problem',
  LOAN_QUERY = 'loan_query',
  FRAUD_REPORT = 'fraud_report',
  FEE_DISPUTE = 'fee_dispute',
  STATEMENT_REQUEST = 'statement_request',
  TECH_SUPPORT = 'tech_support',
  COMPLAINT = 'complaint',
}

export enum TicketPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_CUSTOMER = 'pending_customer',
  PENDING_INFO = 'pending_info',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

@Entity('crm_service_ticket')
@Index(['customerId'])
@Index(['ticketNumber'])
export class CrmServiceTicket extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'ticket_number' })
  @Index()
  ticketNumber: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 50 })
  category: TicketCategory;

  @Column({ type: 'varchar', length: 255, name: 'subject_title' })
  subjectTitle: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority: TicketPriority;

  @Column({ type: 'varchar', length: 30, name: 'source_channel' })
  sourceChannel: string;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_agent_id' })
  assignedAgentId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'assigned_team' })
  assignedTeam?: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: TicketStatus;

  @Column({ type: 'text', nullable: true, name: 'resolution_notes' })
  resolutionNotes?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'resolution_code' })
  resolutionCode?: string;

  @Column({ type: 'int', nullable: true, name: 'customer_satisfaction_rating' })
  customerSatisfactionRating?: number;

  @Column({ type: 'int', nullable: true, name: 'nps_score' })
  npsScore?: number;

  @Column({ type: 'text', nullable: true, name: 'feedback_text' })
  feedbackText?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'attached_documents' })
  attachedDocuments?: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true, name: 'related_interaction_id' })
  relatedInteractionId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'related_account_id' })
  relatedAccountId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'related_card_id' })
  relatedCardId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'related_loan_id' })
  relatedLoanId?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'sla_deadline' })
  slaDeadline?: Date;

  @Column({ type: 'boolean', default: false, name: 'sla_breached' })
  slaBreached: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'resolved_at' })
  resolvedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'closed_at' })
  closedAt?: Date;
}
