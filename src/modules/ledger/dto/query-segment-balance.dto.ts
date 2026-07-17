import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SegmentType, SegmentStatus } from '../entities/ledger-segment.entity';

export class QuerySegmentBalanceDto {
  @ApiProperty({ required: false, description: 'Filtrar por tipo de segmento' })
  @IsOptional()
  @IsEnum(SegmentType)
  segmentType?: SegmentType;

  @ApiProperty({ required: false, description: 'Filtrar por estado' })
  @IsOptional()
  @IsEnum(SegmentStatus)
  status?: SegmentStatus;

  @ApiProperty({ required: false, description: 'Incluir rollup jerárquico' })
  @IsOptional()
  includeRollup?: boolean;

  @ApiProperty({ required: false, description: 'ID específico de segmento' })
  @IsOptional()
  @IsUUID()
  segmentId?: string;
}
