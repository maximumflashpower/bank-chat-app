import { IsUUID, IsOptional, IsDateString, IsString } from 'class-validator';

export class InventoryValuationReportDto {
  @IsUUID()
  companyProfileId: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}
