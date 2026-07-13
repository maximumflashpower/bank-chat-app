import { IsString, IsEnum, IsOptional } from 'class-validator';
import { AlertStatus } from '../entities/alert-status.enum';

export class InvestigateAlertDto {
  @IsEnum(AlertStatus)
  status: AlertStatus;

  @IsOptional()
  @IsString()
  investigationNotes?: string;

  @IsOptional()
  @IsString()
  caseId?: string;
}
