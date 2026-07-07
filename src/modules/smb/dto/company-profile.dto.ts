import { IsString, IsOptional, IsInt, IsUUID } from 'class-validator';

export class CompanyProfileDto {
  @IsUUID()
  userId: string;

  @IsString()
  legalBusinessName: string;

  @IsOptional()
  @IsString()
  tradeNameDbah?: string;

  @IsString()
  taxIdentificationNumber: string;

  @IsString()
  businessStructureType: string;

  @IsOptional()
  @IsString()
  industryCodeNaics?: string;

  @IsOptional()
  @IsInt()
  fiscalYearStartMonth?: number;

  @IsOptional()
  @IsString()
  baseCurrency?: string;

  @IsOptional()
  @IsString()
  addressStreet?: string;

  @IsOptional()
  @IsString()
  addressCity?: string;

  @IsOptional()
  @IsString()
  addressStateProvince?: string;

  @IsOptional()
  @IsString()
  addressPostalCode?: string;

  @IsString()
  addressCountryCode: string;

  @IsOptional()
  @IsString()
  contactPhoneMain?: string;

  @IsOptional()
  @IsString()
  contactEmailPrimary?: string;

  @IsOptional()
  @IsString()
  logoUploadUrl?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;
}
