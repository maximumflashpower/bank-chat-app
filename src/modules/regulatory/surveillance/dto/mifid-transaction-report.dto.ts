import { IsString, IsDateString, IsOptional } from 'class-validator';

export class MifidTransactionReportDto {
  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsOptional()
  @IsString()
  instrumentSymbol?: string;
}
