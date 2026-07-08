import { IsUUID, IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryTaxLineItemDto } from './inventory-tax-line-item.dto';

export class CalculateInventorySalesTaxDto {
  @IsUUID()
  @IsNotEmpty()
  companyProfileId: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsOptional()
  jurisdictionCode?: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  calculationMethod?: string;

  @IsString()
  @IsOptional()
  referenceDoc?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryTaxLineItemDto)
  lineItems: InventoryTaxLineItemDto[];
}
