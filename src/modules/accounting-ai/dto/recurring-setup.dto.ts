import { IsString, IsDate, IsOptional, IsBoolean, IsObject, IsNumber } from 'class-validator';

export class RecurringSetupDto {
  @IsString()
  templateName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  frequency: string;

  @IsOptional()
  @IsNumber()
  frequencyInterval?: number;

  @IsDate()
  startDate: string;

  @IsOptional()
  @IsDate()
  endDate?: string;

  @IsObject()
  entryLinesTemplate: any;

  @IsOptional()
  @IsBoolean()
  autoGenerate?: boolean;

  @IsOptional()
  @IsBoolean()
  skipWeekend?: boolean;

  @IsOptional()
  @IsBoolean()
  adjustFirstDay?: boolean;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
