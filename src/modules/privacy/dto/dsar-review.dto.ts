import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DsarStatus } from '../entities/dsar-status.enum';

export class DsarReviewDto {
  @ApiProperty({
    description: 'Nuevo estado para la solicitud DSAR',
    enum: DsarStatus,
    example: 'processing',
  })
  @IsEnum(DsarStatus)
  status: DsarStatus;

  @ApiProperty({
    description: 'Notas internas del DPO',
    required: false,
  })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
