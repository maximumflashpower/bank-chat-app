import { IsUUID, IsString, IsNumber, IsOptional, IsNotEmpty, MaxLength, IsInt } from 'class-validator';

export class InvoiceLineItemDto {
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

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
