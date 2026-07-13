import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CheckExportLicenseDto {
  @IsString()
  exporterName: string;

  @IsString()
  exporterCountry: string;

  @IsString()
  destinationCountry: string;

  @IsString()
  itemDescription: string;

  @IsString()
  classification: string;

  @IsOptional()
  @IsBoolean()
  dualUseGoods?: boolean;
}
