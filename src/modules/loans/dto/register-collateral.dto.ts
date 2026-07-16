// src/modules/loans/dto/register-collateral.dto.ts

import { IsUUID, IsString, IsNumber, IsOptional, IsEnum, IsInt, IsDateString } from 'class-validator';
import { CollateralType, PropertyType } from '../entities/loans.enums.js';

export class RegisterCollateralDto {
  @IsUUID()
  loanId: string;

  @IsEnum(CollateralType)
  collateralType: CollateralType;

  @IsString()
  description: string;

  @IsNumber()
  assessedValue: number;

  @IsOptional()
  @IsDateString()
  assessmentDate?: string;

  @IsOptional()
  @IsString()
  appraiserName?: string;

  @IsOptional()
  @IsString()
  appraisalReportUrl?: string;

  @IsOptional()
  @IsInt()
  lienPosition?: number;

  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;

  @IsOptional()
  @IsNumber()
  insuranceCoverageAmount?: number;

  @IsOptional()
  @IsDateString()
  insuranceExpiryDate?: string;

  @IsOptional()
  @IsString()
  vehicleVin?: string;

  @IsOptional()
  @IsString()
  propertyAddress?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;
}
