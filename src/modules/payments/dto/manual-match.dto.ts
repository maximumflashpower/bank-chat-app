import { IsString, IsUUID, IsOptional } from 'class-validator';

export class ManualMatchDto {
  @IsUUID()
  statementLineId: string;

  @IsUUID()
  instructionId: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  invoiceNumbers?: string;

  @IsOptional()
  @IsString()
  adjustedBy?: string;
}
