import { IsEnum, IsString, IsOptional } from 'class-validator';
import { AlertStatus } from '../entities/soc-alert.entity';

export class ClassifyAlertDto {
  @IsEnum(AlertStatus)
  classification: AlertStatus;

  @IsString()
  @IsOptional()
  falsePositiveReason?: string;
}
