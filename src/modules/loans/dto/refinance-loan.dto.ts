import { IsNumber, IsString, IsOptional, IsBoolean, Min } from 'class-validator';

export class RefinanceLoanDto {
  @IsNumber()
  @Min(0)
  newLoanAmount: number;

  @IsNumber()
  @Min(0)
  newInterestRate: number;

  @IsNumber()
  termMonths: number;

  @IsBoolean()
  @IsOptional()
  cashOut?: boolean;

  @IsNumber()
  @IsOptional()
  cashOutAmount?: number;

  @IsString()
  @IsOptional()
  lenderName?: string;
}
