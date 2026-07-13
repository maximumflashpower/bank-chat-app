import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveBreakDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsUUID()
  breakId: string;

  @ApiProperty({ example: 'posting_error' })
  @IsString()
  resolutionAction: string;

  @ApiPropertyOptional({ example: 'Corrected duplicate posting JE-1023' })
  @IsString()
  @IsOptional()
  rootCauseAnalysis?: string;

  @ApiPropertyOptional({ example: 'uuid-here' })
  @IsUUID()
  @IsOptional()
  adjustmentEntryId?: string;

  @ApiPropertyOptional({ example: 'uuid-here' })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;
}
