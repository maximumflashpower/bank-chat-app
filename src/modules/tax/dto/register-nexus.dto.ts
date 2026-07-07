import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class RegisterNexusDto {
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  regionState?: string;

  @IsString()
  nexusType: string;

  @IsOptional()
  @IsString()
  thresholdAmount?: string;

  @IsOptional()
  @IsDateString()
  registrationDate?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
