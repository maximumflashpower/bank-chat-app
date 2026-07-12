import { IsString, IsDateString, IsUUID, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CertifyPeriodDto {
  @ApiProperty({ example: '2026-06' })
  @IsString()
  period: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  certificationDate: string;

  @ApiProperty()
  @IsUUID()
  certifiedBy: string;

  @ApiPropertyOptional({ example: 'All breaks resolved. Period reconciled.' })
  @IsString()
  @IsOptional()
  certificationNotes?: string;

  @ApiPropertyOptional({ type: [String], example: ['batch_uuid_1', 'batch_uuid_2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  batchIds?: string[];

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  overrideOpenBreaks?: boolean;
}
