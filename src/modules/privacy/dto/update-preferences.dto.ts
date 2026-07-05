import { IsArray, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConsentPurpose } from '../entities/consent-purpose.enum';

export class UpdatePreferencesDto {
  @ApiProperty({
    description: 'Lista de propósitos que el usuario consiente (los no listados se revocan)',
    enum: ConsentPurpose,
    isArray: true,
    required: false,
    example: ['essential', 'analytics'],
  })
  @IsOptional()
  @IsArray()
  purposes?: ConsentPurpose[];

  @ApiProperty({
    description: 'Si se revocan todos los consentimientos no esenciales',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  revokeAllNonEssential?: boolean;
}
