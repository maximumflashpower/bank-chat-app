import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Notification } from '../entities/notification.entity';
import { NotificationType } from '../entities/notification-type.enum';
import { NotificationChannel } from '../entities/notification-channel.enum';
import { NotificationStatus } from '../entities/notification-status.enum';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
    @InjectRedis() private redis: Redis,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notif = this.notifRepo.create({
      userId: dto.userId,
      type: dto.type,
      channel: dto.channel ?? NotificationChannel.IN_APP,
      status: NotificationStatus.UNREAD,
      title: dto.title,
      body: dto.body,
      metadata: dto.metadata ?? null,
    });
    const saved = await this.notifRepo.save(notif);

    // Publish to Redis for real-time delivery (WebSocket subscribers will consume)
    await this.redis.publish(
      `notifications:${dto.userId}`,
      JSON.stringify({
        id: saved.id,
        type: saved.type,
        title: saved.title,
        body: saved.body,
        metadata: saved.metadata,
        createdAt: saved.createdAt,
      }),
    );

    this.logger.log(`Notification created: ${saved.id} — user: ${dto.userId} — type: ${dto.type}`);
    return saved;
  }

  async getUserNotifications(
    userId: string,
    options: { limit?: number; offset?: number; status?: NotificationStatus } = {},
  ): Promise<{ data: Notification[]; total: number }> {
    const { limit = 50, offset = 0, status } = options;
    const qb = this.notifRepo.createQueryBuilder('n');

    qb.where('n.user_id = :userId', { userId });
    if (status) {
      qb.andWhere('n.status = :status', { status });
    }
    qb.orderBy('n.created_at', 'DESC')
      .skip(offset)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getUnreadCount(userId: string): Promise<{ unread: number }> {
    const count = await this.notifRepo.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
    return { unread: count };
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notif = await this.notifRepo.findOne({
      where: { id: notificationId, userId },
    });
    if (!notif) {
      throw new NotFoundException('Notification not found');
    }
    notif.status = NotificationStatus.READ;
    notif.readAt = new Date();
    return this.notifRepo.save(notif);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notifRepo.update(
      { userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ, readAt: new Date() },
    );
    return { updated: result.affected ?? 0 };
  }

  async archive(userId: string, notificationId: string): Promise<Notification> {
    const notif = await this.notifRepo.findOne({
      where: { id: notificationId, userId },
    });
    if (!notif) {
      throw new NotFoundException('Notification not found');
    }
    notif.status = NotificationStatus.ARCHIVED;
    return this.notifRepo.save(notif);
  }
}
