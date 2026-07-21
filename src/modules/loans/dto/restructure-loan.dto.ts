import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class RestructureLoanDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsNumber()
  @IsOptional()
  newTermMonths?: number;

  @IsNumber()
  @IsOptional()
  newInterestRate?: number;

  @IsNumber()
  @IsOptional()
  newMonthlyPayment?: number;

  @IsString()
  @IsOptional()
  hardshipType?: string;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @IsNumber()
  @IsOptional()
  newRate?: number;
}
