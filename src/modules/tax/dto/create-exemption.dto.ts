import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateExemptionDto {
  @IsUUID()
  customerId: string;

  @IsString()
  exemptionType: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  certificateNumber?: string;

  @IsOptional()
  @IsString()
  jurisdictionCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
