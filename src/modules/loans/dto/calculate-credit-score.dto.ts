import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CalculateCreditScoreDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsOptional()
  bureauScore?: number;

  @IsNumber()
  @IsOptional()
  annualIncome?: number;

  @IsNumber()
  @IsOptional()
  debtToIncome?: number;

  @IsString()
  @IsOptional()
  employmentStatus?: string;

  @IsNumber()
  @IsOptional()
  creditHistoryMonths?: number;
}
