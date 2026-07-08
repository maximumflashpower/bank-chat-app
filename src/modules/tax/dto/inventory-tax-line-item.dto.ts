import { IsUUID, IsString, IsOptional, IsNumber, IsNotEmpty, MaxLength } from 'class-validator';

export class InventoryTaxLineItemDto {
  @IsUUID()
  @IsNotEmpty()
  stockMovementId: string;

  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  itemName?: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxCategoryOverride?: string;
}
