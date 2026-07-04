import { Entity, Column, Index, ManyToMany, OneToMany, JoinTable, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';
import { ConversationType } from './conversation-type.enum';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

@Entity({ name: 'conversations' })
export class Conversation extends BaseEntity {
  @ApiProperty({ enum: ConversationType, example: ConversationType.DIRECT })
  @Column({ name: 'type', type: 'enum', enum: ConversationType })
  type: ConversationType;

  @ApiProperty({ example: 'Grupo familiar', description: 'Display name for groups/channels', required: false })
  @Column({ name: 'title', type: 'varchar', length: 200, nullable: true })
  title: string | null;

  @ApiProperty({ example: 'https://...avatar.png', required: false })
  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: 'Último mensaje...', description: 'Cached last message preview', required: false })
  @Column({ name: 'last_message_preview', type: 'varchar', length: 500, nullable: true })
  lastMessagePreview: string | null;

  @ApiProperty({ example: '2026-07-04T01:00:00Z', description: 'Last activity timestamp', required: false })
  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt: Date | null;

  @ApiProperty({ type: String, description: 'Creator user UUID' })
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => IdentityUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: IdentityUser;

  @OneToMany(() => ConversationParticipant, (p) => p.conversation, { cascade: true })
  participants: ConversationParticipant[];

  @OneToMany(() => Message, (m) => m.conversation, { cascade: false })
  messages: Message[];
}
