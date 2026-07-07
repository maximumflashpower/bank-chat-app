import { IsString, IsNumber, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CalculateTaxDto {
  @IsString()
  transactionId: string;

  @IsString()
  currency: string;

  @IsNumber()
  taxableAmount: number;

  @IsOptional()
  @IsString()
  jurisdictionCode?: string;

  @IsOptional()
  @IsString()
  productTaxCode?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  calculationMethod?: string;

  @IsOptional()
  @IsString()
  referenceDoc?: string;

  @IsOptional()
  @IsArray()
  breakdownItems?: any[];
}
