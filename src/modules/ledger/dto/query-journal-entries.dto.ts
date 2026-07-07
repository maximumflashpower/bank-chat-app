import { IsOptional, IsString, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JournalEntryStatus } from '../entities/journal-entry-status.enum';

export class QueryJournalEntriesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fiscal_period_id?: string;

  @ApiPropertyOptional({ enum: JournalEntryStatus })
  @IsOptional()
  @IsEnum(JournalEntryStatus)
  status?: JournalEntryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;
}
