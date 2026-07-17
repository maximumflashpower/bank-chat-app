import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';

export enum AnomalySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class AiAnomalyDetectionDto {
  @ApiProperty({ required: false, example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ required: false, example: '2026-07-17' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({ required: false, description: 'Filtrar por tipo de cuenta' })
  @IsOptional()
  @IsString()
  accountType?: string;
}

export class AnomalyResult {
  @ApiProperty()
  id: string;

  @ApiProperty()
  journalEntryId: string;

  @ApiProperty({ enum: AnomalySeverity })
  severity: AnomalySeverity;

  @ApiProperty()
  score: number;

  @ApiProperty()
  anomalyType: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  detectedAt: Date;

  @ApiProperty()
  reviewed: boolean;
}
