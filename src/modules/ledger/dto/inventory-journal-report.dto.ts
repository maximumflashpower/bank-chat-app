import { IsOptional, IsDateString, IsUUID } from 'class-validator';

export class InventoryJournalReportDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  companyProfileId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  movementType?: string;
}
