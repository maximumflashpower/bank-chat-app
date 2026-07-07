import { IsString, IsInt, IsOptional } from 'class-validator';

export class FiscalYearReportDto {
  @IsInt()
  fiscalYear: number;

  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  declarationType?: string;

  @IsOptional()
  @IsString()
  format?: string;
}
