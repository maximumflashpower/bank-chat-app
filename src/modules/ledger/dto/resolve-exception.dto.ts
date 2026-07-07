import { IsUUID, IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JournalLineReconStatus } from '../entities/journal-line-recon-status.enum';

export class ResolveExceptionDto {
  @ApiProperty()
  @IsUUID()
  journal_line_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resolution_note: string;

  @ApiPropertyOptional({ enum: JournalLineReconStatus })
  @IsOptional()
  @IsEnum(JournalLineReconStatus)
  new_status?: JournalLineReconStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bank_ref_id?: string;
}
