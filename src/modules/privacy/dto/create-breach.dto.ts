import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BreachSeverity } from '../entities/breach-severity.enum';

export class CreateBreachDto {
  @ApiProperty({ description: 'Título descriptivo de la brecha' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Descripción detallada del incidente', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Categoría de ataque', required: false, example: 'Unauthorized Access' })
  @IsOptional()
  @IsString()
  attackCategory?: string;

  @ApiProperty({ description: 'Origen de detección', required: false, default: 'manual' })
  @IsOptional()
  @IsString()
  detectionSource?: string;

  @ApiProperty({ description: 'Severidad inicial estimada', enum: BreachSeverity, required: false })
  @IsOptional()
  @IsEnum(BreachSeverity)
  initialSeverity?: BreachSeverity;

  @ApiProperty({ description: 'Número de usuarios afectados', required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  affectedUserCount?: number;

  @ApiProperty({ description: 'Categorías de datos afectadas', isArray: true, required: false })
  @IsOptional()
  @IsString({ each: true })
  dataCategoriesAffected?: string[];
}
