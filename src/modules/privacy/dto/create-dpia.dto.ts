import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DpiaRiskLevel } from '../entities/dpia-risk-level.enum';

export class CreateDpiaDto {
  @ApiProperty({ description: 'Actividad de procesamiento a evaluar' })
  @IsUUID()
  activityId: string;

  @ApiProperty({
    description: 'Nivel de riesgo identificado',
    enum: DpiaRiskLevel,
  })
  @IsEnum(DpiaRiskLevel)
  riskLevel: DpiaRiskLevel;

  @ApiProperty({
    description: 'Descripción detallada del riesgo',
    required: false,
  })
  @IsOptional()
  @IsString()
  riskDescription?: string;

  @ApiProperty({
    description: 'Medidas de mitigación propuestas',
    required: false,
  })
  @IsOptional()
  @IsString()
  mitigationMeasures?: string;

  @ApiProperty({
    description: 'Riesgo residual tras mitigación',
    enum: DpiaRiskLevel,
    required: false,
  })
  @IsOptional()
  @IsEnum(DpiaRiskLevel)
  residualRisk?: DpiaRiskLevel;

  @ApiProperty({ description: 'Usuario que crea la DPIA' })
  @IsUUID()
  createdBy: string;
}
