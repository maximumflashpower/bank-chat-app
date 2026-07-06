import { IsUUID, IsArray, IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccessReviewDto {
  @ApiProperty({ example: 'quarterly_q3_2026' })
  @IsString()
  @MaxLength(100)
  campaignName: string;

  @ApiProperty({ type: () => [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  targetUserIds: string[];

  @ApiPropertyOptional({ type: () => String })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  justification?: string;

  @ApiProperty({ type: () => Date, format: 'date-time' })
  @IsDateString()
  dueDate: string;
}
