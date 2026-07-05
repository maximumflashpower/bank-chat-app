import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConsentPurpose } from '../entities/consent-purpose.enum';
import { ConsentLegalBasis } from '../entities/consent-legal-basis.enum';

export class GrantConsentDto {
  @ApiProperty({
    description: 'Propósito del procesamiento',
    enum: ConsentPurpose,
    example: 'marketing',
  })
  @IsEnum(ConsentPurpose)
  purpose: ConsentPurpose;

  @ApiProperty({
    description: 'Base legal para el procesamiento',
    enum: ConsentLegalBasis,
    example: 'consent',
  })
  @IsEnum(ConsentLegalBasis)
  legalBasis: ConsentLegalBasis;

  @ApiProperty({
    description: 'Sub-consentimientos específicos (canales, terceros, etc.)',
    required: false,
    example: '{"channels":["email","sms"]}',
  })
  @IsOptional()
  @IsObject()
  granularity?: Record<string, unknown>;

  @ApiProperty({
    description: 'Versión de la política de privacidad aceptada',
    required: false,
    example: '1.0',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  version?: string;
}
