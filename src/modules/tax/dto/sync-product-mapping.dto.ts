import { IsUUID, IsString, IsOptional, IsArray, IsNotEmpty, MaxLength } from 'class-validator';

export class SyncProductMappingDto {
  @IsUUID()
  @IsNotEmpty()
  companyProfileId: string;

  @IsArray()
  @IsString({ each: true })
  skus?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(2)
  countryCode?: string;
}
