import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentPerformanceQueryDto {
  @ApiPropertyOptional({ description: 'ID del agente específico' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Fecha inicio del rango (ISO)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin del rango (ISO)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Equipo del agente' })
  @IsOptional()
  @IsString()
  team?: string;
}

export class UpdateAgentMetricsDto {
  @ApiPropertyOptional({ description: 'Llamadas atendidas' })
  @IsOptional()
  callsHandled?: number;

  @ApiPropertyOptional({ description: 'Tickets resueltos' })
  @IsOptional()
  ticketsResolved?: number;

  @ApiPropertyOptional({ description: 'Score de satisfacción (0-100)' })
  @IsOptional()
  satisfactionScore?: number;

  @ApiPropertyOptional({ description: 'Tiempo promedio de manejo (segundos)' })
  @IsOptional()
  averageHandleTimeSec?: number;
}
