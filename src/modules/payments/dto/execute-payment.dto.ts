import { IsString, IsOptional } from 'class-validator';

export class ExecutePaymentDto {
  @IsOptional()
  @IsString()
  executionChannel?: string;

  @IsOptional()
  @IsString()
  priorityOverride?: string;
}
