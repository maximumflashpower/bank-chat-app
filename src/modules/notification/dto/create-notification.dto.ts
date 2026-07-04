import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, MaxLength } from 'class-validator';
import { NotificationType } from '../entities/notification-type.enum';
import { NotificationChannel } from '../entities/notification-channel.enum';

export class CreateNotificationDto {
  @ApiProperty({ type: String })
  @IsString()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationChannel, required: false })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiProperty({ example: 'Depósito recibido' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Recibiste $5,000.00 MXN' })
  @IsString()
  @MaxLength(1000)
  body: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
