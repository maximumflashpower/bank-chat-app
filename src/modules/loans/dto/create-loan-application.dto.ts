// src/modules/loans/dto/create-loan-application.dto.ts

import { IsUUID, IsNumber, IsInt, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { EmploymentStatus } from '../entities/loans.enums.js';

export class CreateLoanApplicationDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  loanProductId: string;

  @IsNumber()
  @Min(0)
  requestedAmount: number;

  @IsInt()
  @Min(1)
  requestedTermMonths: number;

  @IsOptional()
  @IsString()
  loanPurpose?: string;

  @IsOptional()
  @IsString()
  purposeDescription?: string;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsString()
  employerName?: string;

  @IsOptional()
  @IsNumber()
  annualIncomeDeclared?: number;

  @IsOptional()
  @IsNumber()
  monthlyIncomeVerified?: number;

  @IsOptional()
  @IsNumber()
  monthlyDebtObligations?: number;
}
