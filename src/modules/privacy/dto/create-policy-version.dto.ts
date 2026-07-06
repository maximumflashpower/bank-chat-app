import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePolicyVersionDto {
  @ApiProperty({ description: 'Número de versión SemVer', example: '1.0' })
  @IsString()
  version: string;

  @ApiProperty({ description: 'Contenido completo de la política' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Requiere re-consentimiento', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  requiresReconsent?: boolean;
}
