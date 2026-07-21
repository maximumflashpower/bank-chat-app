import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsDateString, IsNumber, IsBoolean, MinLength, IsEnum } from 'class-validator';


export class CreateCorrespondentDto {
  @ApiProperty({ description: 'Código SWIFT BIC', minLength: 8, maxLength: 11 })
  @IsString()
  @MinLength(8)
  bankCodeSwift: string;

  @ApiProperty({ description: 'Nombre legal completo' })
  @IsString()
  bankLegalName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiProperty({ description: 'País sede' })
  @IsString()
  headquartersCountry: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  headquartersCity?: string;

  @ApiProperty({ description: 'Moneda principal' })
  @IsString()
  primaryCurrency: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ each: true })
  supportedCurrencies?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  contactOperationsEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  contactComplianceEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maximumExposureUsd?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  countryRiskRating?: string;
}
