import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { NotificationType } from './notification-type.enum';
import { NotificationChannel } from './notification-channel.enum';
import { NotificationStatus } from './notification-status.enum';

@Entity({ name: 'notifications' })
export class Notification extends BaseEntity {
  @ApiProperty({ type: String, description: 'Target user UUID' })
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.TRANSACTION,
  })
  @Index()
  @Column({ name: 'type', type: 'enum', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({
    enum: NotificationChannel,
    example: NotificationChannel.IN_APP,
  })
  @Column({
    name: 'channel',
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel: NotificationChannel;

  @ApiProperty({ enum: NotificationStatus, example: NotificationStatus.UNREAD })
  @Index()
  @Column({
    name: 'status',
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @ApiProperty({ example: 'Depósito recibido' })
  @Column({ name: 'title', type: 'varchar', length: 200 })
  title: string;

  @ApiProperty({ example: 'Recibiste $5,000.00 MXN en tu cuenta principal' })
  @Column({ name: 'body', type: 'varchar', length: 1000 })
  body: string;

  @ApiProperty({
    example: '{"accountId":"...","amount":5000}',
    description: 'Structured metadata',
    required: false,
  })
  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({
    example: null,
    description: 'When the notification was read',
    required: false,
  })
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;
}
