import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

@Entity('crm_chatbot_conversation')
@Index(['customer_id'])
@Index(['conversation_token'])
export class CrmChatbotConversation extends BaseEntity {
  @Column({ type: 'varchar', length: 100, name: 'conversation_token' })
  @Index()
  conversationToken: string;

  @Column({ type: 'uuid', nullable: true, name: 'customer_id' })
  customerId?: string;

  @Column({ type: 'boolean', default: false, name: 'is_authenticated' })
  isAuthenticated: boolean;

  @Column({ type: 'varchar', length: 10, default: 'es', name: 'language_detected' })
  languageDetected: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'intent_detected' })
  intentDetected?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'entities_extracted' })
  entitiesExtracted?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true, name: 'messages_history' })
  messagesHistory?: Record<string, unknown>;

  @Column({ type: 'int', default: 0, name: 'total_messages' })
  totalMessages: number;

  @Column({ type: 'boolean', default: false, name: 'resolved_by_bot' })
  resolvedByBot: boolean;

  @Column({ type: 'boolean', default: false, name: 'transferred_to_human' })
  transferredToHuman: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'transfer_reason' })
  transferReason?: string;

  @Column({ type: 'int', nullable: true, name: 'satisfaction_rating' })
  satisfactionRating?: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'session_ended_at' })
  sessionEndedAt?: Date;

  @Column({ type: 'timestamptz', name: 'session_started_at' })
  sessionStartedAt: Date;
}
