import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CalculateWithholdingDto {
  @IsString()
  withholdingType: string;

  @IsNumber()
  grossAmount: number;

  @IsOptional()
  @IsNumber()
  withholdingRate?: number;

  @IsOptional()
  @IsUUID()
  withholdeeId?: string;

  @IsOptional()
  @IsString()
  taxpayerRucNitId?: string;

  @IsOptional()
  @IsString()
  invoiceReference?: string;

  @IsOptional()
  @IsString()
  servicePeriodStart?: string;

  @IsOptional()
  @IsString()
  servicePeriodEnd?: string;
}
