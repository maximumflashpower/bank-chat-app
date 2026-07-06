import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DataPortabilityDto {
  @ApiProperty({ description: 'Formato de exportación', example: 'json', enum: ['json', 'csv'] })
  @IsString()
  format: string;

  @ApiProperty({ description: 'ID del usuario solicitante' })
  @IsString()
  userId: string;
}
