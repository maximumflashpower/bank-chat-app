import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReconType } from '../entities/recon-type.enum';

export class ScheduleReconDto {
  @ApiProperty({ enum: ReconType })
  @IsEnum(ReconType)
  reconciliationType: ReconType;

  @ApiProperty({ example: '0 2 * * *' })
  @IsString()
  cronExpression: string;

  @ApiPropertyOptional({ example: '2026-07-15' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 'America/Mexico_City' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
