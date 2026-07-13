import { IsString, IsNumber, IsEnum, IsArray, IsOptional } from 'class-validator';
import { SurveillanceAlertType } from '../entities/surveillance-alert-type.enum';

export class CreateSurveillanceAlertDto {
  @IsEnum(SurveillanceAlertType)
  alertType: SurveillanceAlertType;

  @IsString()
  instrumentSymbol: string;

  @IsArray()
  transactionIds: string[];

  @IsString()
  traderId: string;

  @IsNumber()
  confidenceScore: number;

  @IsOptional()
  patternDetail?: Record<string, unknown>;
}
