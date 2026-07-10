import { ChatService } from './chat.service';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { Conversation } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { Message } from '../entities/message.entity';
import { ConversationType } from '../entities/conversation-type.enum';
import { MessageType } from '../entities/message-type.enum';
import { MessageDelivery } from '../entities/message-status.enum';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';

jest.mock('../entities/conversation.entity');
jest.mock('../entities/conversation-participant.entity');
jest.mock('../entities/message.entity');

describe('ChatService', () => {
  let service: ChatService;
  let mockConvoRepo: Partial<Repository<Conversation>>;
  let mockParticipantRepo: Partial<Repository<ConversationParticipant>>;
  let mockMessageRepo: Partial<Repository<Message>>;
  let mockRedis: Partial<Redis>;

  const now = new Date(2026, 6, 10, 12, 0, 0);

  beforeEach(() => {
    mockConvoRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockParticipantRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      softRemove: jest.fn(),
    };

    mockMessageRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockRedis = {
      publish: jest.fn().mockResolvedValue(1),
    };

    (mockConvoRepo.create as jest.Mock).mockReturnValue({});
    (mockParticipantRepo.create as jest.Mock).mockReturnValue({});
    (mockMessageRepo.create as jest.Mock).mockReturnValue({});

    service = new ChatService(
      mockConvoRepo as Repository<Conversation>,
      mockParticipantRepo as Repository<ConversationParticipant>,
      mockMessageRepo as Repository<Message>,
      mockRedis as Redis,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('createConversation', () => {
    it('debe crear conversación DIRECT con 2 participantes', async () => {
      const dto: CreateConversationDto = {
        type: ConversationType.DIRECT,
        participantIds: ['user-002'],
      };

      const convo: any = {
        id: 'convo-001',
        type: ConversationType.DIRECT,
        title: null,
        createdBy: 'user-001',
        lastMessageAt: now,
      };

      // findExistingDirect busca participaciones del user A
      (mockParticipantRepo.find as jest.Mock).mockResolvedValue([]);
      (mockConvoRepo.create as jest.Mock).mockReturnValue(convo);
      (mockConvoRepo.save as jest.Mock).mockResolvedValue(convo);
      (mockParticipantRepo.create as jest.Mock).mockReturnValue({});
      (mockParticipantRepo.save as jest.Mock).mockResolvedValue([]);

      const result = await service.createConversation('user-001', dto);

      expect(result.id).toBe('convo-001');
      expect(mockConvoRepo.save).toHaveBeenCalled();
      expect(mockParticipantRepo.save).toHaveBeenCalled();
    });

    it('debe retornar conversación existente si ya existe DIRECT entre los mismos usuarios', async () => {
      const dto: CreateConversationDto = {
        type: ConversationType.DIRECT,
        participantIds: ['user-002'],
      };

      const existingConvo: any = {
        id: 'convo-existing',
        type: ConversationType.DIRECT,
        title: null,
        createdBy: 'user-002',
        lastMessageAt: now,
      };

      // findExistingDirect: encuentra participación con conversación DIRECT
      (mockParticipantRepo.find as jest.Mock).mockResolvedValue([
        { conversationId: 'convo-existing', conversation: existingConvo },
      ]);
      // Encuentra participación del user B en esa conversación
      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue({
        userId: 'user-002',
        conversationId: 'convo-existing',
      });

      const result = await service.createConversation('user-001', dto);

      expect(result.id).toBe('convo-existing');
      expect(mockConvoRepo.save).not.toHaveBeenCalled();
    });

    it('debe lanzar error si DIRECT no tiene exactamente 2 participantes', async () => {
      const dto: CreateConversationDto = {
        type: ConversationType.DIRECT,
        participantIds: ['user-002', 'user-003'],
      };

      await expect(service.createConversation('user-001', dto))
        .rejects.toThrow('exactly 2 participants');
    });

    it('debe crear conversación GROUP con múltiples participantes', async () => {
      const dto: CreateConversationDto = {
        type: ConversationType.GROUP,
        title: 'Team Chat',
        participantIds: ['user-002', 'user-003'],
      };

      const convo: any = {
        id: 'convo-group-001',
        type: ConversationType.GROUP,
        title: 'Team Chat',
        createdBy: 'user-001',
        lastMessageAt: now,
      };

      (mockConvoRepo.create as jest.Mock).mockReturnValue(convo);
      (mockConvoRepo.save as jest.Mock).mockResolvedValue(convo);
      (mockParticipantRepo.save as jest.Mock).mockResolvedValue([]);

      const result = await service.createConversation('user-001', dto);

      expect(result.id).toBe('convo-group-001');
      expect(mockParticipantRepo.save).toHaveBeenCalled();
    });
  });

  describe('getUserConversations', () => {
    it('debe listar conversaciones del usuario con último mensaje y conteo de no leídos', async () => {
      const participations: any[] = [
        {
          userId: 'user-001',
          conversationId: 'convo-001',
          lastReadAt: now,
          conversation: {
            id: 'convo-001',
            type: ConversationType.DIRECT,
            title: null,
            avatarUrl: null,
            lastMessagePreview: 'Hello',
            lastMessageAt: now,
          },
        },
      ];

      const participants: any[] = [
        { userId: 'user-001', isAdmin: false, isMuted: false, user: { phoneNumber: '+123' } },
        { userId: 'user-002', isAdmin: false, isMuted: false, user: { phoneNumber: '+456' } },
      ];

      const lastMessage: any = {
        content: 'Latest message',
        createdAt: now,
      };

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };

      (mockParticipantRepo.find as jest.Mock)
        .mockResolvedValueOnce(participations)
        .mockResolvedValueOnce(participants);
      (mockMessageRepo.findOne as jest.Mock).mockResolvedValue(lastMessage);
      (mockMessageRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMock);

      const result = await service.getUserConversations('user-001');

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('convo-001');
      expect(result[0].lastMessagePreview).toBe('Latest message');
      expect(result[0].unreadCount).toBe(2);
      expect(result[0].participants.length).toBe(2);
    });

    it('debe retornar array vacío si el usuario no tiene conversaciones', async () => {
      (mockParticipantRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserConversations('user-001');

      expect(result).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    it('debe enviar mensaje y publicar a Redis', async () => {
      const participation: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
        isMuted: false,
      };

      const message: any = {
        id: 'msg-001',
        conversationId: 'convo-001',
        senderId: 'user-001',
        type: MessageType.TEXT,
        content: 'Hello world',
        mediaMetadata: null,
        clientMessageId: null,
        replyToId: null,
        deliveryStatus: MessageDelivery.SENT,
        createdAt: now,
      };

      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(participation);
      (mockMessageRepo.create as jest.Mock).mockReturnValue(message);
      (mockMessageRepo.save as jest.Mock).mockResolvedValue(message);
      (mockConvoRepo.update as jest.Mock).mockResolvedValue(undefined);
      (mockParticipantRepo.find as jest.Mock).mockResolvedValue([
        { userId: 'user-001' },
        { userId: 'user-002' },
      ]);

      const dto: SendMessageDto = {
        type: MessageType.TEXT,
        content: 'Hello world',
      };

      const result = await service.sendMessage('user-001', 'convo-001', dto);

      expect(result.id).toBe('msg-001');
      expect(mockRedis.publish).toHaveBeenCalledTimes(1);
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'chat:user:user-002',
        expect.any(String),
      );
    });

    it('debe lanzar ForbiddenException si el usuario no es participante', async () => {
      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(null);

      const dto: SendMessageDto = {
        type: MessageType.TEXT,
        content: 'Hello',
      };

      await expect(service.sendMessage('user-001', 'convo-001', dto))
        .rejects.toThrow('not a participant');
    });

    it('debe lanzar ForbiddenException si el usuario está muteado', async () => {
      const participation: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
        isMuted: true,
      };

      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(participation);

      const dto: SendMessageDto = {
        type: MessageType.TEXT,
        content: 'Hello',
      };

      await expect(service.sendMessage('user-001', 'convo-001', dto))
        .rejects.toThrow('muted');
    });

    it('debe retornar mensaje existente si clientMessageId coincide', async () => {
      const participation: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
        isMuted: false,
      };

      const existingMessage: any = {
        id: 'msg-existing',
        conversationId: 'convo-001',
        clientMessageId: 'client-001',
        content: 'Already sent',
      };

      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(participation);
      (mockMessageRepo.findOne as jest.Mock).mockResolvedValue(existingMessage);

      const dto: SendMessageDto = {
        type: MessageType.TEXT,
        content: 'Hello world',
        clientMessageId: 'client-001',
      };

      const result = await service.sendMessage('user-001', 'convo-001', dto);

      expect(result.id).toBe('msg-existing');
      expect(mockMessageRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('debe obtener mensajes paginados de una conversación', async () => {
      const participation: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
      };

      const messages: any[] = [
        { id: 'msg-001', content: 'Hello', createdAt: now },
        { id: 'msg-002', content: 'World', createdAt: now },
      ];

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(messages),
      };

      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(participation);
      (mockMessageRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMock);

      const result = await service.getMessages('user-001', 'convo-001');

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('msg-001');
    });

    it('debe lanzar ForbiddenException si no es participante', async () => {
      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getMessages('user-001', 'convo-001'))
        .rejects.toThrow('not a participant');
    });

    it('debe filtrar mensajes anteriores al cursor "before"', async () => {
      const participation: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
      };

      const beforeMsg: any = {
        id: 'msg-old',
        createdAt: new Date(2026, 6, 9, 12, 0, 0),
      };

      const messages: any[] = [
        { id: 'msg-001', content: 'Older msg', createdAt: new Date(2026, 6, 8) },
      ];

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(messages),
      };

      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(participation);
      (mockMessageRepo.findOne as jest.Mock).mockResolvedValue(beforeMsg);
      (mockMessageRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMock);

      const result = await service.getMessages('user-001', 'convo-001', 50, 'msg-old');

      expect(result.length).toBe(1);
      expect(qbMock.andWhere).toHaveBeenCalledWith('m.created_at < :beforeDate', {
        beforeDate: beforeMsg.createdAt,
      });
    });
  });

  describe('markAsRead', () => {
    it('debe marcar conversación como leída y actualizar mensajes no leídos', async () => {
      const participation: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
        lastReadAt: null,
      };

      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(participation);
      (mockParticipantRepo.save as jest.Mock).mockResolvedValue(participation);
      (mockMessageRepo.update as jest.Mock).mockResolvedValue(undefined);

      const result = await service.markAsRead('user-001', 'convo-001');

      expect(result.read).toBe(true);
      expect(participation.lastReadAt).toBeDefined();
      expect(mockMessageRepo.update).toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenException si no es participante', async () => {
      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.markAsRead('user-001', 'convo-001'))
        .rejects.toThrow('not a participant');
    });
  });

  describe('addParticipant', () => {
    it('debe agregar participante si el solicitante es admin', async () => {
      const requesterPart: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
        isAdmin: true,
      };

      (mockParticipantRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(requesterPart) // requester
        .mockResolvedValueOnce(null); // target not already participant

      const newParticipant: any = {
        userId: 'user-002',
        conversationId: 'convo-001',
        isAdmin: false,
      };

      (mockParticipantRepo.create as jest.Mock).mockReturnValue(newParticipant);
      (mockParticipantRepo.save as jest.Mock).mockResolvedValue(newParticipant);

      const result = await service.addParticipant('user-001', 'convo-001', 'user-002');

      expect(result.userId).toBe('user-002');
      expect(result.isAdmin).toBe(false);
    });

    it('debe lanzar ForbiddenException si el solicitante no es admin', async () => {
      const requesterPart: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
        isAdmin: false,
      };

      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(requesterPart);

      await expect(service.addParticipant('user-001', 'convo-001', 'user-002'))
        .rejects.toThrow('Only admins can add');
    });

    it('debe lanzar BadRequestException si el usuario ya es participante', async () => {
      const requesterPart: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
        isAdmin: true,
      };

      const existingPart: any = {
        userId: 'user-002',
        conversationId: 'convo-001',
      };

      (mockParticipantRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(requesterPart)
        .mockResolvedValueOnce(existingPart);

      await expect(service.addParticipant('user-001', 'convo-001', 'user-002'))
        .rejects.toThrow('already a participant');
    });
  });

  describe('removeParticipant', () => {
    it('debe remover participante si el solicitante es admin', async () => {
      const requesterPart: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
        isAdmin: true,
      };

      const targetPart: any = {
        userId: 'user-002',
        conversationId: 'convo-001',
      };

      (mockParticipantRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(requesterPart)
        .mockResolvedValueOnce(targetPart);
      (mockParticipantRepo.softRemove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.removeParticipant('user-001', 'convo-001', 'user-002');

      expect(result.removed).toBe(true);
      expect(mockParticipantRepo.softRemove).toHaveBeenCalledWith(targetPart);
    });

    it('debe permitir auto-removerse aunque no sea admin', async () => {
      const requesterPart: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
        isAdmin: false,
      };

      const targetPart: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
      };

      (mockParticipantRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(requesterPart)
        .mockResolvedValueOnce(targetPart);
      (mockParticipantRepo.softRemove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.removeParticipant('user-001', 'convo-001', 'user-001');

      expect(result.removed).toBe(true);
    });

    it('debe lanzar ForbiddenException si no es admin y no se auto-remueve', async () => {
      const requesterPart: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
        isAdmin: false,
      };

      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(requesterPart);

      await expect(service.removeParticipant('user-001', 'convo-001', 'user-002'))
        .rejects.toThrow('Only admins can remove');
    });

    it('debe lanzar NotFoundException si el participante objetivo no existe', async () => {
      const requesterPart: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
        isAdmin: true,
      };

      (mockParticipantRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(requesterPart)
        .mockResolvedValueOnce(null);

      await expect(service.removeParticipant('user-001', 'convo-001', 'user-999'))
        .rejects.toThrow('not found');
    });
  });

  describe('editMessage', () => {
    it('debe editar el contenido del propio mensaje', async () => {
      const message: any = {
        id: 'msg-001',
        senderId: 'user-001',
        content: 'Original',
        isEdited: false,
      };

      (mockMessageRepo.findOne as jest.Mock).mockResolvedValue(message);
      (mockMessageRepo.save as jest.Mock).mockResolvedValue({
        ...message,
        content: 'Edited',
        isEdited: true,
      });

      const result = await service.editMessage('user-001', 'msg-001', 'Edited');

      expect(result.content).toBe('Edited');
      expect(result.isEdited).toBe(true);
    });

    it('debe lanzar NotFoundException si el mensaje no existe', async () => {
      (mockMessageRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.editMessage('user-001', 'msg-999', 'Edited'))
        .rejects.toThrow('not found');
    });

    it('debe lanzar ForbiddenException si no es el sender', async () => {
      const message: any = {
        id: 'msg-001',
        senderId: 'user-002',
        content: 'Original',
      };

      (mockMessageRepo.findOne as jest.Mock).mockResolvedValue(message);

      await expect(service.editMessage('user-001', 'msg-001', 'Edited'))
        .rejects.toThrow('only edit your own');
    });
  });

  describe('deleteMessage', () => {
    it('debe eliminar (soft) el propio mensaje del usuario', async () => {
      const message: any = {
        id: 'msg-001',
        senderId: 'user-001',
        content: 'Delete me',
        conversationId: 'convo-001',
        isDeleted: false,
      };

      (mockMessageRepo.findOne as jest.Mock).mockResolvedValue(message);
      (mockMessageRepo.save as jest.Mock).mockResolvedValue({
        ...message,
        isDeleted: true,
        content: null,
      });

      const result = await service.deleteMessage('user-001', 'msg-001');

      expect(result.deleted).toBe(true);
      expect(message.isDeleted).toBe(true);
      expect(message.content).toBeNull();
    });

    it('debe permitir a un admin eliminar mensajes de otros', async () => {
      const message: any = {
        id: 'msg-001',
        senderId: 'user-002',
        content: 'Delete by admin',
        conversationId: 'convo-001',
        isDeleted: false,
      };

      const adminPart: any = {
        userId: 'user-001',
        conversationId: 'convo-001',
        isAdmin: true,
      };

      (mockMessageRepo.findOne as jest.Mock).mockResolvedValue(message);
      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(adminPart);
      (mockMessageRepo.save as jest.Mock).mockResolvedValue({
        ...message,
        isDeleted: true,
        content: null,
      });

      const result = await service.deleteMessage('user-001', 'msg-001');

      expect(result.deleted).toBe(true);
    });

    it('debe lanzar ForbiddenException si no es sender ni admin', async () => {
      const message: any = {
        id: 'msg-001',
        senderId: 'user-002',
        content: 'Cannot delete',
        conversationId: 'convo-001',
      };

      (mockMessageRepo.findOne as jest.Mock).mockResolvedValue(message);
      (mockParticipantRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteMessage('user-001', 'msg-001'))
        .rejects.toThrow('only delete your own');
    });

    it('debe lanzar NotFoundException si el mensaje no existe', async () => {
      (mockMessageRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteMessage('user-001', 'msg-999'))
        .rejects.toThrow('not found');
    });
  });
});
