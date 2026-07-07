import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CashflowProjectionDto {
  @IsString()
  countryCode: string;

  @IsNumber()
  currentBalance: number;

  @IsOptional()
  @IsNumber()
  projectedPeriodMonths?: number;

  @IsOptional()
  @IsArray()
  knownTransactions?: any[];

  @IsOptional()
  @IsString()
  scenarioType?: string;
}
