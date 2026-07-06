import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ObjectionDto {
  @ApiProperty({ description: 'ID del usuario solicitante' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Tipo de objeción', example: 'direct_marketing' })
  @IsString()
  objectionType: string;

  @ApiProperty({ description: 'Razón de la objeción', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
