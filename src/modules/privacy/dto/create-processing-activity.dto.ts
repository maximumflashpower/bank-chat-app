import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConsentLegalBasis } from '../entities/consent-legal-basis.enum';

export class CreateProcessingActivityDto {
  @ApiProperty({ description: 'Nombre del proceso de tratamiento' })
  @IsNotEmpty()
  @IsString()
  activityName: string;

  @ApiProperty({ description: 'Propósito del tratamiento' })
  @IsNotEmpty()
  @IsString()
  purpose: string;

  @ApiProperty({
    description: 'Categorías de datos tratados',
    isArray: true,
    example: ['identifying', 'contact_info'],
  })
  @IsNotEmpty()
  @IsArray()
  dataCategories: string[];

  @ApiProperty({
    description: 'Tipos de titulares',
    isArray: true,
    example: ['clients'],
  })
  @IsNotEmpty()
  @IsArray()
  dataSubjects: string[];

  @ApiProperty({
    description: 'Base legal GDPR',
    enum: ConsentLegalBasis,
  })
  @IsEnum(ConsentLegalBasis)
  legalBasis: ConsentLegalBasis;

  @ApiProperty({
    description: 'Terceros receptores',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  recipients?: string[];

  @ApiProperty({
    description: 'Países de transferencia internacional',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  transferCountries?: string[];

  @ApiProperty({
    description: 'Tiempo de retención',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  retentionPeriod?: string;

  @ApiProperty({
    description: 'Medidas de seguridad',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  securityMeasures?: string[];
}
