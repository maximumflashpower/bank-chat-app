import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateTaxRateDto {
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  regionState?: string;

  @IsOptional()
  @IsString()
  cityMunicipality?: string;

  @IsOptional()
  @IsString()
  zipPostalCode?: string;

  @IsString()
  ruleType: string;

  @IsNumber()
  rateStandard: number;

  @IsOptional()
  @IsNumber()
  rateReduced?: number;

  @IsOptional()
  @IsNumber()
  rateSuperReduced?: number;

  @IsDateString()
  effectiveDate: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsString()
  sourceLawReference?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
