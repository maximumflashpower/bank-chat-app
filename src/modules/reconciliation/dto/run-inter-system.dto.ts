import { IsUUID, IsDateString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RunInterSystemDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsUUID()
  accountId: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2026-07-31' })
  @IsDateString()
  periodEnd: string;

  @ApiPropertyOptional({ example: 0.01 })
  @IsNumber()
  @IsOptional()
  toleranceAmount?: number;
}
