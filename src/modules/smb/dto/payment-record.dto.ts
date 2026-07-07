import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class PaymentRecordDto {
  @IsUUID()
  invoiceId: string;

  @IsNumber()
  amountPaid: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsUUID()
  recordedByUserId: string;

  @IsOptional()
  @IsString()
  transactionReference?: string;
}
