import { IsString, IsOptional, IsEnum } from 'class-validator';
import { SoxAssertionStatus } from '../entities/sox-assertion-status.enum';

export class RemediateSoxDeficiencyDto {
  @IsString()
  controlId: string;

  @IsOptional()
  @IsString()
  remediationPlan?: string;

  @IsOptional()
  @IsEnum(SoxAssertionStatus)
  newStatus?: SoxAssertionStatus;
}
