import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BreachSeverity } from '../entities/breach-severity.enum';

export class AssessBreachDto {
  @ApiProperty({ description: 'Nivel de severidad evaluado', enum: BreachSeverity })
  @IsEnum(BreachSeverity)
  severityLevel: BreachSeverity;

  @ApiProperty({ description: 'Número de usuarios afectados', required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  affectedUserCount?: number;

  @ApiProperty({ description: 'Categorías de datos afectadas', isArray: true, required: false })
  @IsOptional()
  @IsString({ each: true })
  dataCategoriesAffected?: string[];

  @ApiProperty({ description: 'Causa raíz identificada', required: false })
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiProperty({ description: 'Acciones correctivas', required: false })
  @IsOptional()
  @IsString()
  remediationActions?: string;

  @ApiProperty({ description: 'Notas del incidente', required: false })
  @IsOptional()
  @IsString()
  incidentNotes?: string;
}
