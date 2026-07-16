// src/modules/loans/dto/loan-payment.dto.ts

import { IsUUID, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class LoanPaymentDto {
  @IsUUID()
  loanId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsBoolean()
  applyToPrincipalOnly?: boolean;
}

export class ExtraPaymentDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsBoolean()
  reduceTerm?: boolean;
}

export class EnrollAutoDebitDto {
  @IsUUID()
  loanId: string;

  @IsUUID()
  accountId: string;
}

export class ConfigureEscrowDto {
  @IsOptional()
  @IsNumber()
  annualTaxEstimate?: number;

  @IsOptional()
  @IsNumber()
  annualInsurancePremium?: number;

  @IsOptional()
  @IsNumber()
  monthlyPmiAmount?: number;
}

export class ModifyLoanDto {
  @IsOptional()
  @IsNumber()
  newInterestRate?: number;

  @IsOptional()
  @IsInt()
  newTermMonths?: number;

  @IsOptional()
  @IsString()
  modificationReason?: string;
}

import { IsInt, IsString } from 'class-validator';
