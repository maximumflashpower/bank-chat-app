import { IsUUID, IsArray, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchType } from '../entities/match-type.enum';

export class BulkMatchPair {
  @ApiProperty()
  @IsUUID()
  sourceARef: string;

  @ApiProperty()
  @IsUUID()
  sourceBRef: string;

  @ApiPropertyOptional({ enum: MatchType })
  @IsEnum(MatchType)
  @IsOptional()
  matchType?: MatchType;

  @ApiPropertyOptional({ example: 'manual_override_batch' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkReconcileDto {
  @ApiProperty()
  @IsUUID()
  batchId: string;

  @ApiProperty({ type: [BulkMatchPair] })
  @IsArray()
  pairs: BulkMatchPair[];

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  performedBy?: string;
}
