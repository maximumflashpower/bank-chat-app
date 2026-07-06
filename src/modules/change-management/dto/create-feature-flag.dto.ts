import { IsBoolean, IsInt, IsObject, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeatureFlagDto {
  @ApiProperty({ description: 'Nombre del flag' })
  @IsString()
  flagKey: string;

  @ApiProperty({ description: 'Descripción', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Activar globalmente', default: false })
  @IsBoolean()
  isEnabled: boolean;

  @ApiProperty({ description: 'Porcentaje de rollout 0-100', required: false, default: 0 })
  @IsOptional()
  @IsInt()
  rolloutPercentage?: number;

  @ApiProperty({ description: 'Usuarios objetivo', required: false })
  @IsOptional()
  @IsArray()
  targetedUsers?: string[];

  @ApiProperty({ description: 'Configuración avanzada', required: false })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiProperty({ description: 'Entorno', required: false, default: 'prod' })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiProperty({ description: 'Dark launch', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDarkLaunch?: boolean;
}
