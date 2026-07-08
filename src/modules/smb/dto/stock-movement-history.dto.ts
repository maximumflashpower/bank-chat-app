import { IsUUID, IsOptional, IsDateString, IsString } from 'class-validator';

export class StockMovementHistoryDto {
  @IsUUID()
  companyProfileId: string;

  @IsOptional()
  @IsUUID()
  itemId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
