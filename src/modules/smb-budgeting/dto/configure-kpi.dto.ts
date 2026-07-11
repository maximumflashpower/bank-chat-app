import { IsString, IsNumber, IsDateString, IsEnum, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum KPITargetType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual'
}

export class ConfigureKpiDto {
  @ApiProperty({ example: 'Revenue' })
  @IsString()
  kpiName: string;

  @ApiProperty({ example: 'Total monthly revenue in USD' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'MONTHLY' })
  @IsEnum(KPITargetType)
  targetType: KPITargetType;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0)
  targetValue: number;

  @ApiProperty({ example: 2026 })
  @IsNumber()
  @IsOptional()
  fiscalYear?: number;

  @ApiPropertyOptional({ example: 'Q1' })
  @IsString()
  @IsOptional()
  periodLabel?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional({})
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
