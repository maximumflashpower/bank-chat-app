import { IsArray, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProcessorAgreementStatus } from '../entities/processor-agreement-status.enum';

export class CreateThirdPartyProcessorDto {
  @ApiProperty({ description: 'Nombre del procesador' })
  @IsString()
  processorName: string;

  @ApiProperty({ description: 'Tipo de servicio' })
  @IsString()
  serviceType: string;

  @ApiProperty({ description: 'Categorías de datos', isArray: true })
  @IsArray()
  @IsString({ each: true })
  dataCategories: string[];

  @ApiProperty({ description: 'Propósito del procesamiento' })
  @IsString()
  purpose: string;

  @ApiProperty({ description: 'Países de transferencia', isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  transferCountries?: string[];

  @ApiProperty({ description: 'Mecanismo de transferencia (SCC/BCR)', required: false })
  @IsOptional()
  @IsString()
  transferMechanism?: string;

  @ApiProperty({ description: 'Estado del acuerdo', enum: ProcessorAgreementStatus, required: false, default: 'active' })
  @IsOptional()
  @IsEnum(ProcessorAgreementStatus)
  agreementStatus?: ProcessorAgreementStatus;

  @ApiProperty({ description: 'Fecha del acuerdo (ISO 8601)' })
  @IsDateString()
  agreementDate: string;

  @ApiProperty({ description: 'Fecha de expiración (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({ description: 'Referencia al documento', required: false })
  @IsOptional()
  @IsString()
  documentRef?: string;
}
