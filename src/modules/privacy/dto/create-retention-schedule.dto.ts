import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RetentionAction } from '../entities/retention-action.enum';

export class CreateRetentionScheduleDto {
  @ApiProperty({ description: 'Nombre del programa de retención' })
  @IsString()
  scheduleName: string;

  @ApiProperty({ description: 'Tabla objetivo de la política' })
  @IsString()
  targetTable: string;

  @ApiProperty({ description: 'Tipo de dato', required: false })
  @IsOptional()
  @IsString()
  dataType?: string;

  @ApiProperty({ description: 'Días de retención', minimum: 1 })
  @IsInt()
  @Min(1)
  retentionDays: number;

  @ApiProperty({ description: 'Campo de fecha de inicio del contador', required: false, default: 'created_at' })
  @IsOptional()
  @IsString()
  startDateField?: string;

  @ApiProperty({ description: 'Acción al expirar', enum: RetentionAction, required: false, default: 'anonymize' })
  @IsOptional()
  @IsEnum(RetentionAction)
  expirationAction?: RetentionAction;

  @ApiProperty({ description: 'Días de gracia adicionales', required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  gracePeriodDays?: number;

  @ApiProperty({ description: 'Es requisito legal obligatorio', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  mandatoryLegalRequirement?: boolean;

  @ApiProperty({ description: 'Referencia legal que lo justifica', required: false })
  @IsOptional()
  @IsString()
  legalReference?: string;

  @ApiProperty({ description: 'Campo de última actividad', required: false })
  @IsOptional()
  @IsString()
  lastActivityField?: string;
}
