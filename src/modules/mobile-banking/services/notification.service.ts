import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MobileNotificationLog } from '../entities/mobile-notification-log.entity';
import { NotificationType, PriorityLevel } from '../enums/mobile.enums';

interface CreateNotificationInput {
  userId: string;
  notificationType: NotificationType;
  title: string;
  bodyText: string;
  payloadData?: Record<string, any>;
  priorityLevel?: PriorityLevel;
  channelsAttempted?: string[];
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(MobileNotificationLog)
    private readonly repo: Repository<MobileNotificationLog>,
  ) {}

  async create(input: CreateNotificationInput): Promise<MobileNotificationLog> {
    const notif = new MobileNotificationLog();
    notif.userId = input.userId;
    notif.notificationType = input.notificationType;
    notif.title = input.title;
    notif.bodyText = input.bodyText;
    notif.priorityLevel = input.priorityLevel ?? PriorityLevel.NORMAL;
    notif.channelsAttempted = input.channelsAttempted ?? ['in_app'];
    if (input.payloadData) notif.payloadData = input.payloadData;

    return this.repo.save(notif);
  }

  async getFeed(userId: string, limit = 50): Promise<MobileNotificationLog[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<MobileNotificationLog> {
    const notif = await this.repo.findOne({
      where: { id: notificationId, userId },
    });

    if (!notif) {
      throw new NotFoundException('Notification not found');
    }

    notif.inAppRead = true;
    notif.readAt = new Date();

    return this.repo.save(notif);
  }

  async markPushDelivered(notificationId: string): Promise<void> {
    await this.repo.update(notificationId, {
      pushDelivered: true,
      deliveredAt: new Date(),
    });
  }

  async markPushOpened(notificationId: string): Promise<void> {
    await this.repo.update(notificationId, {
      pushOpened: true,
      openedAt: new Date(),
    });
  }

  async dismiss(notificationId: string, userId: string): Promise<MobileNotificationLog> {
    const notif = await this.repo.findOne({
      where: { id: notificationId, userId },
    });

    if (!notif) {
      throw new NotFoundException('Notification not found');
    }

    notif.dismissedAt = new Date();

    return this.repo.save(notif);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({
      where: { userId, inAppRead: false },
    });
  }
}
