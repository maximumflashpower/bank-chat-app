import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatbotConverseDto {
  @ApiProperty({ description: 'Mensaje del usuario' })
  @IsNotEmpty()
  @IsString()
  userMessage: string;

  @ApiPropertyOptional({ description: 'ID de sesión de conversación existente' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Contexto adicional (metadata libre)' })
  @IsOptional()
  context?: Record<string, any>;
}

export class ChatbotEscalateDto {
  @ApiProperty({ description: 'ID de la conversación a escalar' })
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @ApiProperty({ description: 'Razón de escalación' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class ChatbotFeedbackDto {
  @ApiProperty({ description: 'ID de la conversación' })
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @ApiProperty({ description: 'Rating 1-5' })
  @IsNotEmpty()
  rating: number;

  @ApiPropertyOptional({ description: 'Comentario del usuario' })
  @IsOptional()
  @IsString()
  comment?: string;
}
