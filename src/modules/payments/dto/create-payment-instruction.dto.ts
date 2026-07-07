import { IsString, IsNumber, IsOptional, IsUUID, IsEnum } from 'class-validator';

export class CreatePaymentInstructionDto {
  @IsString()
  paymentType: string;

  @IsString()
  urgency: string;

  @IsUUID()
  sourceAccountId: string;

  @IsOptional()
  @IsUUID()
  destinationBeneficiaryId?: string;

  @IsNumber()
  amountOriginal: number;

  @IsString()
  currencyOriginal: string;

  @IsOptional()
  @IsNumber()
  fxAmountSettled?: number;

  @IsOptional()
  @IsNumber()
  fxRateUsed?: number;

  @IsOptional()
  @IsString()
  chargeBearer?: string;

  @IsOptional()
  @IsString()
  purposeCode?: string;

  @IsOptional()
  @IsString()
  referencePayerNotes?: string;

  @IsOptional()
  @IsString()
  paymentReasonDescription?: string;

  @IsOptional()
  @IsString()
  settlementMethod?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
