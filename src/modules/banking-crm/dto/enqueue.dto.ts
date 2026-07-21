import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnqueueDto {
  @ApiProperty({ description: 'ID de interacción origen' })
  @IsNotEmpty()
  @IsString()
  interactionId: string;

  @ApiProperty({ description: 'ID del cliente' })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Canal de origen', enum: ['self_service_app', 'web', 'chatbot', 'phone', 'branch', 'social', 'email'] })
  @IsNotEmpty()
  @IsString()
  channelOrigin: string;

  @ApiProperty({ description: 'Tipo de interacción', enum: ['voice', 'chat', 'video', 'cobrowse', 'screen_share', 'callback'] })
  @IsNotEmpty()
  @IsString()
  interactionType: string;

  @ApiPropertyOptional({ description: 'Nivel de prioridad', enum: ['low', 'normal', 'high', 'urgent'] })
  @IsOptional()
  @IsString()
  priorityLevel?: string;

  @ApiPropertyOptional({ description: 'Skill requerida del agente' })
  @IsOptional()
  @IsString()
  skillRequired?: string;

  @ApiPropertyOptional({ description: 'Idioma requerido (ISO code)' })
  @IsOptional()
  @IsString()
  languageRequired?: string;
}
