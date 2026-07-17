import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsObject } from 'class-validator';
import { SegmentType } from '../entities/ledger-segment.entity';

export class CreateSegmentDto {
  @ApiProperty({ example: 'BR-001', description: 'Código único del segmento' })
  @IsString()
  @IsNotEmpty()
  segmentCode: string;

  @ApiProperty({ example: 'Sucursal Centro', description: 'Nombre descriptivo' })
  @IsString()
  @IsNotEmpty()
  segmentName: string;

  @ApiProperty({ enum: SegmentType, example: SegmentType.BRANCH })
  @IsEnum(SegmentType)
  segmentType: SegmentType;

  @ApiProperty({ required: false, description: 'ID del segmento padre' })
  @IsOptional()
  @IsUUID()
  parentSegmentId?: string;

  @ApiProperty({ required: false, description: 'Metadata adicional del segmento' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
