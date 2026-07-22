import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { Repository } from 'typeorm';
import { MobileNotificationLog } from '../entities/mobile-notification-log.entity';
import { NotificationType, PriorityLevel } from '../enums/mobile.enums';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;
  let repo: Repository<MobileNotificationLog>;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    notificationType: NotificationType.TRANSACTION_ALERT,
    title: 'Payment Received',
    bodyText: 'You received $500',
    priorityLevel: PriorityLevel.NORMAL,
    channelsAttempted: ['in_app'],
    pushDelivered: true,
    inAppRead: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(MobileNotificationLog),
          useValue: {
            save: jest.fn((notif) => Promise.resolve(notif)),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    repo = module.get<Repository<MobileNotificationLog>>(getRepositoryToken(MobileNotificationLog));
  });

  describe('create', () => {
    it('should create notification with default priority NORMAL', async () => {
      jest.spyOn(repo, 'save').mockImplementation((n) => Promise.resolve(n as any));

      const input = {
        userId: 'user-1',
        notificationType: NotificationType.TRANSACTION_ALERT,
        title: 'Payment Received',
        bodyText: 'You received $500',
      };

      const result = await service.create(input);

      expect(result.priorityLevel).toBe(PriorityLevel.NORMAL);
      expect(result.channelsAttempted).toEqual(['in_app']);
    });

    it('should create notification with custom priority', async () => {
      jest.spyOn(repo, 'save').mockImplementation((n) => Promise.resolve(n as any));

      const input = {
        userId: 'user-1',
        notificationType: NotificationType.FRAUD_ALERT,
        title: 'Suspicious Activity',
        bodyText: 'Unusual login detected',
        priorityLevel: PriorityLevel.HIGH,
      };

      const result = await service.create(input);

      expect(result.priorityLevel).toBe(PriorityLevel.HIGH);
    });

    it('should create notification with payload data', async () => {
      jest.spyOn(repo, 'save').mockImplementation((n) => Promise.resolve(n as any));

      const input = {
        userId: 'user-1',
        notificationType: NotificationType.TRANSACTION_ALERT,
        title: 'Payment',
        bodyText: '$500 received',
        payloadData: { transactionId: 'txn-123', amount: 500 },
      };

      const result = await service.create(input);

      expect(result.payloadData).toEqual({ transactionId: 'txn-123', amount: 500 });
    });
  });

  describe('getFeed', () => {
    it('should return notification feed ordered by created DESC', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([mockNotification as any]);

      const result = await service.getFeed('user-1', 50);

      expect(result).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockNotification as any);
      jest.spyOn(repo, 'save').mockImplementation((n) => Promise.resolve(n as any));

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(result.inAppRead).toBe(true);
      expect(result.readAt).toBeDefined();
    });

    it('should throw NotFoundException if notification not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.markAsRead('notif-999', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markPushDelivered', () => {
    it('should mark push as delivered', async () => {
      jest.spyOn(repo, 'update').mockResolvedValue({} as any);

      await service.markPushDelivered('notif-1');

      expect(repo.update).toHaveBeenCalledWith('notif-1', {
        pushDelivered: true,
        deliveredAt: expect.any(Date),
      });
    });
  });

  describe('markPushOpened', () => {
    it('should mark push as opened', async () => {
      jest.spyOn(repo, 'update').mockResolvedValue({} as any);

      await service.markPushOpened('notif-1');

      expect(repo.update).toHaveBeenCalledWith('notif-1', {
        pushOpened: true,
        openedAt: expect.any(Date),
      });
    });
  });

  describe('dismiss', () => {
    it('should dismiss notification', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockNotification as any);
      jest.spyOn(repo, 'save').mockImplementation((n) => Promise.resolve(n as any));

      const result = await service.dismiss('notif-1', 'user-1');

      expect(result.dismissedAt).toBeDefined();
    });

    it('should throw NotFoundException if notification not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.dismiss('notif-999', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      jest.spyOn(repo, 'count').mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(repo.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', inAppRead: false },
      });
    });
  });
});
