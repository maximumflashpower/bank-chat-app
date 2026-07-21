import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDateString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OwnershipType } from '../entities/consolidation-entity.entity';

export class CreateEntityDto {
  @ApiProperty({ example: 'ENT-001' })
  @IsString()
  entityCode: string;

  @ApiProperty({ example: 'Bank Corp Mexico' })
  @IsString()
  legalName: string;

  @ApiProperty({ example: 'MX' })
  @IsString()
  countryCode: string;

  @ApiProperty({ example: 'MXN' })
  @IsString()
  functionalCurrency: string;

  @ApiProperty({ example: 'USD', required: false })
  @IsOptional()
  @IsString()
  reportingCurrencyGroup?: string;

  @ApiProperty({ example: 100, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  ownershipPercentage: number;

  @ApiProperty({ enum: OwnershipType })
  @IsEnum(OwnershipType)
  ownershipType: OwnershipType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parentEntityId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  acquisitionDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  acquisitionMethod?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minorityInterestPct?: number;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  consolidationLevel?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  taxJurisdiction?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  segmentClassification?: string;
}
