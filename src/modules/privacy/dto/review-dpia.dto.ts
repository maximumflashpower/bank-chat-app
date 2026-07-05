import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DpiaStatus } from '../entities/dpia-status.enum';
import { DpiaRiskLevel } from '../entities/dpia-risk-level.enum';

export class ReviewDpiaDto {
  @ApiProperty({
    description: 'Nuevo estado del DPIA',
    enum: DpiaStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(DpiaStatus)
  status?: DpiaStatus;

  @ApiProperty({
    description: 'Consulta al DPO realizada',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  consultedDpo?: boolean;

  @ApiProperty({
    description: 'Opinión del DPO',
    required: false,
  })
  @IsOptional()
  @IsString()
  dpoOpinion?: string;

  @ApiProperty({
    description: 'Autoridad supervisora notificada',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  supervisoryAuthorityNotified?: boolean;

  @ApiProperty({
    description: 'Riesgo residual final',
    enum: DpiaRiskLevel,
    required: false,
  })
  @IsOptional()
  @IsEnum(DpiaRiskLevel)
  residualRisk?: DpiaRiskLevel;
}
