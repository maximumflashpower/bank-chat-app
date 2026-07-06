import { IsOptional, IsString, IsDateString, IsArray, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GovAuditFilterDto {
  @ApiPropertyOptional({ type: () => String })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  actionType?: string;

  @ApiPropertyOptional({ type: () => String })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ type: () => Date })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ type: () => Date })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ type: () => [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  complianceTags?: string[];
}
