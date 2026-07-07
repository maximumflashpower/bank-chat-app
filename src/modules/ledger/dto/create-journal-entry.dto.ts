import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JournalLineDto {
  @ApiProperty()
  @IsUUID()
  account_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  segment_branch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  segment_dept_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  segment_project_id?: string;

  @ApiProperty()
  @IsNotEmpty()
  debit: number;

  @ApiProperty()
  @IsNotEmpty()
  credit: number;

  @ApiProperty({ default: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty()
  @IsDateString()
  effective_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line_description?: string;
}

export class CreateJournalEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsUUID()
  fiscal_period_id: string;

  @ApiProperty({ default: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ type: [JournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source_entity?: string;
}
