import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  MaxLength,
} from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  barcode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  itemName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  subcategory?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unitOfMeasure: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  valuationMethod?: string;

  @IsNumber()
  @IsOptional()
  standardCost?: number;

  @IsNumber()
  @IsOptional()
  sellingPrice?: number;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @IsNumber()
  @IsOptional()
  reorderQuantity?: number;

  @IsInt()
  @IsOptional()
  leadTimeDays?: number;

  @IsBoolean()
  @IsOptional()
  isPerishable?: boolean;

  @IsInt()
  @IsOptional()
  shelfLifeDays?: number;

  @IsBoolean()
  @IsOptional()
  serialTrackingEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  lotTrackingEnabled?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  abcClassification?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  hsTariffCode?: string;
}
