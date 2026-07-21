import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferInteractionDto {
  @ApiProperty({ description: 'ID de interacción a transferir' })
  @IsNotEmpty()
  @IsString()
  interactionId: string;

  @ApiProperty({ description: 'Canal destino', enum: ['voice', 'chat', 'video', 'cobrowse', 'callback'] })
  @IsNotEmpty()
  @IsString()
  targetChannel: string;

  @ApiPropertyOptional({ description: 'Agente destino específico (opcional)' })
  @IsOptional()
  @IsString()
  targetAgentId?: string;

  @ApiPropertyOptional({ description: 'Mensaje de transferencia' })
  @IsOptional()
  @IsString()
  transferMessage?: string;
}

export class CobrowseSessionDto {
  @ApiProperty({ description: 'ID de la sesión de cobrowsing' })
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'URL compartida' })
  @IsNotEmpty()
  @IsString()
  sharedUrl: string;

  @ApiProperty({ description: 'Permisos del agente', enum: ['view_only', 'navigate', 'fill_forms', 'full_control'] })
  @IsNotEmpty()
  @IsString()
  agentPermission: string;
}
