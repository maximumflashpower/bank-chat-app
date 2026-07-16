// src/modules/loans/dto/mortgage.dto.ts

import { IsUUID, IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class OrderAppraisalDto {
  @IsUUID()
  applicationId: string;

  @IsString()
  propertyAddress: string;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsNumber()
  estimatedValue?: number;
}

export class TitleSearchDto {
  @IsUUID()
  applicationId: string;

  @IsString()
  propertyAddress: string;
}
