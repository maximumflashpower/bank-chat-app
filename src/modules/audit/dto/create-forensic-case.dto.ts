import { IsString, IsEnum, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ForensicSeverity } from '../entities/forensic-severity.enum';

export class CreateForensicCaseDto {
  @ApiProperty({ example: 'FC-2026-001' })
  @IsString()
  caseNumber: string;

  @ApiProperty({ example: 'Unauthorized access to admin panel' })
  @IsString()
  title: string;

  @ApiProperty({ enum: ForensicSeverity })
  @IsEnum(ForensicSeverity)
  severity: ForensicSeverity;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  estimatedResolution?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  regulatoryDeadline?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  affectedUsers?: string[];
}
