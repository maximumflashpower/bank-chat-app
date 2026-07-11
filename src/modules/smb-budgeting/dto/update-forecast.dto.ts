import { IsNumber, IsString, IsObject, IsOptional, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForecastPeriod {
  @IsString()
  period: string; // '2026-07', '2026-Q3', etc.

  @IsNumber()
  projectedValue: number;

  @IsOptional()
  @IsNumber()
  confidence?: number; // 0-100

  @IsOptional()
  @IsObject()
  assumptions?: Record<string, unknown>;
}

export class UpdateForecastDto {
  @ApiProperty({ type: [ForecastPeriod] })
  @ArrayMinSize(1)
  periods: ForecastPeriod[];

  @ApiPropertyOptional({ example: 'Revenue', default: 'Revenue' })
  @IsString()
  @IsOptional()
  metric?: string;

  @ApiPropertyOptional({ example: '2026' })
  @IsString()
  @IsOptional()
  fiscalYear?: string;

  @ApiPropertyOptional({})
  @IsObject()
  @IsOptional()
  methodology?: Record<string, unknown>;
}
