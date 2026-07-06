import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChangeImpact } from '../entities/change-impact.enum';

export class CreateChangeRequestDto {
  @ApiProperty({ description: 'Título del cambio' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detalle técnico' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ChangeImpact, required: false })
  @IsOptional()
  @IsEnum(ChangeImpact)
  impactLevel?: ChangeImpact;

  @ApiProperty({ description: 'Score de riesgo 0-10', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  riskScore?: number;

  @ApiProperty({ description: 'Plan de rollback' })
  @IsString()
  rollbackPlan: string;

  @ApiProperty({ description: 'Feature flag asociado', required: false })
  @IsOptional()
  @IsString()
  featureFlag?: string;
}
