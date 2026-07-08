import { IsString, IsDateString, IsObject, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class ReportResponseDto {
  @IsString()
  reportType: string;

  @IsString()
  companyProfileId: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsDateString()
  generatedAt: string;

  @IsObject()
  data: Record<string, unknown>;

  @IsArray()
  warnings: string[];

  @IsBoolean()
  fromSnapshot: boolean;
}
