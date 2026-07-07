import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateReportDto {
  @ApiProperty({ example: 'case-uuid-here' })
  @IsString()
  caseId: string;

  @ApiProperty({ example: 'Quarterly SOX compliance audit', required: false })
  @IsString()
  @IsOptional()
  reportTitle?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  evidenceIds?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  format?: string;
}
