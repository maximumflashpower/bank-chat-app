import { IsUUID, IsOptional, IsNumber } from 'class-validator';

export class InventoryAgingDto {
  @IsUUID()
  companyProfileId: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsNumber()
  minDays?: number;

  @IsOptional()
  @IsNumber()
  maxDays?: number;
}
