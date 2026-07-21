import { IsNumber, IsString, IsOptional, IsDate, Min } from 'class-validator';

export class RestructureLoanDto {
  @IsString()
  newTermMonths: number;

  @IsNumber()
  @Min(0)
  newInterestRate: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsDate()
  @IsOptional()
  effectiveDate?: Date;
}
