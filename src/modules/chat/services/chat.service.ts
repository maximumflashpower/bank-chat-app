import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Conversation } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { Message } from '../entities/message.entity';
import { ConversationType } from '../entities/conversation-type.enum';
import { MessageType } from '../entities/message-type.enum';
import { MessageDelivery } from '../entities/message-status.enum';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Conversation)
    private convoRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private participantRepo: Repository<ConversationParticipant>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRedis() private redis: Redis,
  ) {}

  async createConversation(userId: string, dto: CreateConversationDto): Promise<Conversation> {
    const allParticipantIds = [...new Set([...dto.participantIds, userId])];

    if (dto.type === ConversationType.DIRECT) {
      if (allParticipantIds.length !== 2) {
        throw new BadRequestException('Direct conversations must have exactly 2 participants');
      }
      const existing = await this.findExistingDirect(allParticipantIds[0], allParticipantIds[1]);
      if (existing) {
        return existing;
      }
    }

    const conversation = this.convoRepo.create({
      type: dto.type,
      title: dto.title ?? null,
      createdBy: userId,
      lastMessageAt: new Date(),
    });
    await this.convoRepo.save(conversation);

    const participants = allParticipantIds.map((pid) =>
      this.participantRepo.create({
        userId: pid,
        conversationId: conversation.id,
        isAdmin: pid === userId && dto.type !== ConversationType.DIRECT,
        lastReadAt: pid === userId ? new Date() : null,
      }),
    );
    await this.participantRepo.save(participants);

    this.logger.log(`Conversation created: ${conversation.id} — type: ${dto.type} — participants: ${allParticipantIds.length}`);
    return conversation;
  }

  async getUserConversations(userId: string): Promise<any[]> {
    const participations = await this.participantRepo.find({
      where: { userId },
      relations: { conversation: true },
      order: { conversation: { lastMessageAt: 'DESC' } },
    });

    const result: any[] = [];
    for (const p of participations) {
      const convo = p.conversation;
      const participants = await this.participantRepo.find({
        where: { conversationId: convo.id },
        relations: { user: true },
      });

      const lastMessage = await this.messageRepo.findOne({
        where: { conversationId: convo.id, isDeleted: false },
        order: { createdAt: 'DESC' },
      });

      result.push({
        id: convo.id,
        type: convo.type,
        title: convo.title,
        avatarUrl: convo.avatarUrl,
        lastMessagePreview: lastMessage?.content ?? convo.lastMessagePreview,
        lastMessageAt: convo.lastMessageAt,
        unreadCount: await this.getUnreadCount(convo.id, p),
        participants: participants.map((part) => ({
          userId: part.userId,
          isAdmin: part.isAdmin,
          isMuted: part.isMuted,
          phoneNumber: part.user?.phoneNumber,
        })),
      });
    }
    return result;
  }

  async sendMessage(senderId: string, conversationId: string, dto: SendMessageDto): Promise<Message> {
    const participation = await this.participantRepo.findOne({
      where: { userId: senderId, conversationId },
    });
    if (!participation) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }
    if (participation.isMuted) {
      throw new ForbiddenException('You are muted in this conversation');
    }

    if (dto.clientMessageId) {
      const existing = await this.messageRepo.findOne({
        where: { clientMessageId: dto.clientMessageId, conversationId },
      });
      if (existing) {
        return existing;
      }
    }

    const message = this.messageRepo.create({
      conversationId,
      senderId,
      type: dto.type,
      content: dto.content ?? null,
      mediaMetadata: dto.mediaMetadata ?? null,
      clientMessageId: dto.clientMessageId ?? null,
      replyToId: dto.replyToId ?? null,
      deliveryStatus: MessageDelivery.SENT,
    });
    await this.messageRepo.save(message);

    const preview = dto.content ?? (dto.type !== MessageType.TEXT ? `[${dto.type}]` : '');
    await this.convoRepo.update(conversationId, {
      lastMessagePreview: preview.slice(0, 500),
      lastMessageAt: new Date(),
    });

    const participantIds = await this.getParticipantIds(conversationId);
    for (const pid of participantIds) {
      if (pid !== senderId) {
        await this.redis.publish(
          `chat:user:${pid}`,
          JSON.stringify({
            event: 'message',
            conversationId,
            message: {
              id: message.id,
              senderId,
              type: message.type,
              content: message.content,
              mediaMetadata: message.mediaMetadata,
              createdAt: message.createdAt,
            },
          }),
        );
      }
    }

    this.logger.log(`Message sent: ${message.id} — convo: ${conversationId} — sender: ${senderId}`);
    return message;
  }

  async getMessages(userId: string, conversationId: string, limit = 50, before?: string): Promise<Message[]> {
    const participation = await this.participantRepo.findOne({
      where: { userId, conversationId },
    });
    if (!participation) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const qb = this.messageRepo.createQueryBuilder('m');
    qb.where('m.conversation_id = :conversationId', { conversationId })
      .andWhere('m.is_deleted = false')
      .orderBy('m.created_at', 'DESC')
      .limit(limit);

    if (before) {
      const beforeMsg = await this.messageRepo.findOne({ where: { id: before } });
      if (beforeMsg) {
        qb.andWhere('m.created_at < :beforeDate', { beforeDate: beforeMsg.createdAt });
      }
    }

    return qb.getMany();
  }

  async markAsRead(userId: string, conversationId: string): Promise<{ read: boolean }> {
    const participation = await this.participantRepo.findOne({
      where: { userId, conversationId },
    });
    if (!participation) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    participation.lastReadAt = new Date();
    await this.participantRepo.save(participation);

    await this.messageRepo.update(
      { conversationId, senderId: Not(userId), deliveryStatus: MessageDelivery.SENT },
      { deliveryStatus: MessageDelivery.READ },
    );

    return { read: true };
  }

  async addParticipant(userId: string, conversationId: string, targetUserId: string): Promise<ConversationParticipant> {
    const requesterPart = await this.participantRepo.findOne({
      where: { userId, conversationId },
    });
    if (!requesterPart) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }
    if (!requesterPart.isAdmin) {
      throw new ForbiddenException('Only admins can add participants');
    }

    const existing = await this.participantRepo.findOne({
      where: { userId: targetUserId, conversationId },
    });
    if (existing) {
      throw new BadRequestException('User is already a participant');
    }

    const participant = this.participantRepo.create({
      userId: targetUserId,
      conversationId,
      isAdmin: false,
    });
    await this.participantRepo.save(participant);

    this.logger.log(`Participant added: ${targetUserId} to conversation ${conversationId}`);
    return participant;
  }

  async removeParticipant(userId: string, conversationId: string, targetUserId: string): Promise<{ removed: boolean }> {
    const requesterPart = await this.participantRepo.findOne({
      where: { userId, conversationId },
    });
    if (!requesterPart) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }
    if (!requesterPart.isAdmin && userId !== targetUserId) {
      throw new ForbiddenException('Only admins can remove other participants');
    }

    const targetPart = await this.participantRepo.findOne({
      where: { userId: targetUserId, conversationId },
    });
    if (!targetPart) {
      throw new NotFoundException('Participant not found');
    }

    await this.participantRepo.softRemove(targetPart);
    return { removed: true };
  }

  async editMessage(userId: string, messageId: string, content: string): Promise<Message> {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    message.content = content;
    message.isEdited = true;
    return this.messageRepo.save(message);
  }

  async deleteMessage(userId: string, messageId: string): Promise<{ deleted: boolean }> {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (message.senderId !== userId) {
      const adminPart = await this.participantRepo.findOne({
        where: { userId, conversationId: message.conversationId, isAdmin: true },
      });
      if (!adminPart) {
        throw new ForbiddenException('You can only delete your own messages');
      }
    }

    message.isDeleted = true;
    message.content = null;
    await this.messageRepo.save(message);
    return { deleted: true };
  }

  // --- Private helpers ---

  private async findExistingDirect(userA: string, userB: string): Promise<Conversation | null> {
    const partA = await this.participantRepo.find({
      where: { userId: userA },
      relations: { conversation: true },
    });
    for (const p of partA) {
      if (p.conversation.type === ConversationType.DIRECT) {
        const partB = await this.participantRepo.findOne({
          where: { userId: userB, conversationId: p.conversationId },
        });
        if (partB) {
          return p.conversation;
        }
      }
    }
    return null;
  }

  private async getParticipantIds(conversationId: string): Promise<string[]> {
    const participants = await this.participantRepo.find({
      where: { conversationId },
      select: { userId: true },
    });
    return participants.map((p) => p.userId);
  }

  private async getUnreadCount(conversationId: string, participation: ConversationParticipant): Promise<number> {
    const qb = this.messageRepo.createQueryBuilder('m');
    qb.where('m.conversation_id = :conversationId', { conversationId })
      .andWhere('m.is_deleted = false')
      .andWhere('m.sender_id != :userId', { userId: participation.userId });

    if (participation.lastReadAt) {
      qb.andWhere('m.created_at > :lastReadAt', { lastReadAt: participation.lastReadAt });
    }

    return qb.getCount();
  }
}
