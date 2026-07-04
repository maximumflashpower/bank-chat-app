import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { Conversation } from './conversation.entity';
import { MessageType } from './message-type.enum';
import { MessageDelivery } from './message-status.enum';

@Entity({ name: 'messages' })
export class Message extends BaseEntity {
  @ApiProperty({ type: String })
  @Index()
  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @ApiProperty({ type: String, description: 'Sender user UUID' })
  @Index()
  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  @Column({ name: 'type', type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @ApiProperty({ enum: MessageDelivery, example: MessageDelivery.SENT })
  @Column({ name: 'delivery_status', type: 'enum', enum: MessageDelivery, default: MessageDelivery.SENT })
  deliveryStatus: MessageDelivery;

  @ApiProperty({ example: 'Hola, ¿cómo estás?' })
  @Column({ name: 'content', type: 'text', nullable: true })
  content: string | null;

  @ApiProperty({ example: '{"url":"https://...","size":1024}', description: 'Media metadata JSON', required: false })
  @Column({ name: 'media_metadata', type: 'jsonb', nullable: true })
  mediaMetadata: Record<string, any> | null;

  @ApiProperty({ example: 'msg-uuid-client', description: 'Client-side idempotency key', required: false })
  @Index()
  @Column({ name: 'client_message_id', type: 'varchar', length: 100, nullable: true })
  clientMessageId: string | null;

  @ApiProperty({ example: null, description: 'Reply-to message UUID', required: false })
  @Index()
  @Column({ name: 'reply_to_id', type: 'uuid', nullable: true })
  replyToId: string | null;

  @ApiProperty({ example: false })
  @Column({ name: 'is_edited', type: 'boolean', default: false })
  isEdited: boolean;

  @ApiProperty({ example: false })
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
}
