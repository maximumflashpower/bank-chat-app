import { IsString, IsNumber, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  customerId: string;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  dueDate: string;

  @IsNumber()
  subtotalNetAmount: number;

  @IsOptional()
  @IsNumber()
  discountPercentageApplied?: number;

  @IsOptional()
  @IsNumber()
  discountAbsoluteAmount?: number;

  @IsNumber()
  taxableBaseAmount: number;

  @IsOptional()
  @IsNumber()
  taxRateAppliedPercent?: number;

  @IsNumber()
  taxAmountCalculated: number;

  @IsOptional()
  @IsNumber()
  shippingHandlingFee?: number;

  @IsNumber()
  grandTotalAmountDue: number;

  @IsOptional()
  @IsString()
  currencyIsoCode?: string;

  @IsOptional()
  @IsString()
  templateLayoutDesignUsed?: string;

  @IsUUID()
  createdByUserId: string;
}
