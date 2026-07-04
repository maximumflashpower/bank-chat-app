import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MaxLength, IsObject } from 'class-validator';
import { MessageType } from '../entities/message-type.enum';

export class SendMessageDto {
  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ example: 'Hola, ¿cómo estás?', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  content?: string;

  @ApiProperty({ required: false, description: 'Media metadata for non-text messages' })
  @IsOptional()
  @IsObject()
  mediaMetadata?: Record<string, any>;

  @ApiProperty({ required: false, description: 'Client-side idempotency key' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  clientMessageId?: string;

  @ApiProperty({ required: false, description: 'UUID of message being replied to' })
  @IsString()
  @IsOptional()
  replyToId?: string;
}
