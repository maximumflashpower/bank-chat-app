import { IsEnum, IsNumber, IsString, IsOptional, IsInt } from 'class-validator';
import { BaselReportType } from '../entities/basel-report-type.enum';

export class GenerateBaselReportDto {
  @IsEnum(BaselReportType)
  reportType: BaselReportType;

  @IsNumber()
  capitalAmount: number;

  @IsNumber()
  riskWeightedAssets: number;

  @IsInt()
  quarter: number;

  @IsInt()
  year: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
