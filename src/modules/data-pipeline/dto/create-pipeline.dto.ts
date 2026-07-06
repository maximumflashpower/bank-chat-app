import { IsEnum, IsObject, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PipelineSourceType } from '../entities/pipeline-source-type.enum';

export class CreatePipelineDto {
  @ApiProperty({ description: 'Nombre del pipeline' })
  @IsString()
  name: string;

  @ApiProperty({ enum: PipelineSourceType, example: PipelineSourceType.KAFKA })
  @IsEnum(PipelineSourceType)
  sourceType: PipelineSourceType;

  @ApiProperty({ description: 'Configuración JSON de la fuente' })
  @IsObject()
  sourceConfig: Record<string, unknown>;

  @ApiProperty({ description: 'Destino de datos' })
  @IsString()
  destination: string;

  @ApiProperty({ description: 'Schedule cron', required: false })
  @IsOptional()
  @IsString()
  schedule?: string;

  @ApiProperty({ description: 'Opciones avanzadas', required: false })
  @IsOptional()
  @IsObject()
  advancedOptions?: Record<string, unknown>;
}
