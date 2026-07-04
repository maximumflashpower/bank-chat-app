import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';
import { Conversation } from './conversation.entity';

@Entity({ name: 'conversation_participants' })
@Index(['userId', 'conversationId'], { unique: true })
export class ConversationParticipant extends BaseEntity {
  @ApiProperty({ type: String })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ type: String })
  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @ApiProperty({ example: false, description: 'Admin privileges in group/channel' })
  @Column({ name: 'is_admin', type: 'boolean', default: false })
  isAdmin: boolean;

  @ApiProperty({ example: false, description: 'Soft-muted (cannot send messages)' })
  @Column({ name: 'is_muted', type: 'boolean', default: false })
  isMuted: boolean;

  @ApiProperty({ example: null, description: 'Last read message timestamp', required: false })
  @Column({ name: 'last_read_at', type: 'timestamptz', nullable: true })
  lastReadAt: Date | null;

  @ManyToOne(() => IdentityUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;

  @ManyToOne(() => Conversation, (c) => c.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
}
