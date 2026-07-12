import { IsString, IsEnum, IsDateString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReconType } from '../entities/recon-type.enum';

export class RunMatchingDto {
  @ApiProperty({ enum: ReconType })
  @IsEnum(ReconType)
  reconType: ReconType;

  @ApiProperty({ example: 'CoreLedger' })
  @IsString()
  sourceSystemA: string;

  @ApiProperty({ example: 'BankFeed' })
  @IsString()
  sourceSystemB: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  periodStartDate: string;

  @ApiProperty({ example: '2026-07-31' })
  @IsDateString()
  periodEndDate: string;

  @ApiPropertyOptional({ example: 0.50 })
  @IsNumber()
  @IsOptional()
  fuzzyToleranceAmount?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  fuzzyToleranceDays?: number;
}
