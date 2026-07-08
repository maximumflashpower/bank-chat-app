import { IsString, IsNumber, IsOptional, IsUUID, IsDateString, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceLineItemDto } from './invoice-line-item.dto';

export class CreateInvoiceWithItemsDto {
  @IsUUID()
  @IsNotEmpty()
  companyProfileId: string;

  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  dueDate: string;

  @IsString()
  @IsOptional()
  currencyIsoCode?: string;

  @IsOptional()
  @IsNumber()
  discountPercentageApplied?: number;

  @IsOptional()
  @IsNumber()
  shippingHandlingFee?: number;

  @IsString()
  @IsOptional()
  referenceDoc?: string;

  @IsUUID()
  @IsNotEmpty()
  createdByUserId: string;

  @IsString()
  @IsOptional()
  jurisdictionCode?: string;
  @IsUUID()
  @IsNotEmpty()
  warehouseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems: InvoiceLineItemDto[];
}
