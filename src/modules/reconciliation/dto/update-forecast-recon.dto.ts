import { IsString, IsArray, IsOptional, IsDateString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ForecastAdjustment {
  @ApiProperty({ example: 'acc_123' })
  @IsString()
  accountId: string;

  @ApiProperty({ example: '50000.00' })
  @IsString()
  adjustedAmount: string;

  @ApiPropertyOptional({ example: 'seasonal_adjustment' })
  @IsString()
  @IsOptional()
  adjustmentReason?: string;
}

export class UpdateForecastReconDto {
  @ApiProperty({ example: '2026-07' })
  @IsString()
  forecastPeriod: string;

  @ApiPropertyOptional({ example: '2026-07-11' })
  @IsDateString()
  @IsOptional()
  asOfDate?: string;

  @ApiProperty({ type: [ForecastAdjustment] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ForecastAdjustment)
  adjustments: ForecastAdjustment[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
