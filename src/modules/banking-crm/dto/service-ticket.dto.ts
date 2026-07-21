import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateTicketStatusDto {
  @ApiProperty({ description: 'Nuevo estado del ticket', enum: ['open', 'in_progress', 'pending_customer', 'resolved', 'closed', 'escalated'] })
  @IsNotEmpty()
  @IsString()
  status: string;
}

export class AssignTicketDto {
  @ApiProperty({ description: 'ID del agente asignado' })
  @IsNotEmpty()
  @IsString()
  agentId: string;

  @ApiPropertyOptional({ description: 'Notas de asignación' })
  @IsOptional()
  @IsString()
  assignmentNotes?: string;
}

export class AddTicketCommentDto {
  @ApiProperty({ description: 'Comentario a agregar' })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiPropertyOptional({ description: 'Tipo de comentario', enum: ['internal', 'customer', 'system'] })
  @IsOptional()
  @IsString()
  commentType?: string;
}

export class EscalateTicketDto {
  @ApiProperty({ description: 'Razón de escalación' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Nivel de escalación', enum: ['supervisor', 'manager', 'executive'] })
  @IsNotEmpty()
  @IsString()
  escalationLevel: string;

  @ApiPropertyOptional({ description: 'SLA breach inminente o ocurrido' })
  @IsOptional()
  @IsString()
  slaBreachReason?: string;
}
