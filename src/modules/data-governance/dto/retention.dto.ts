import { IsString, IsInt, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { DispositionAction } from '../entities/datagov-retention-policy.entity';

export class CreateRetentionPolicyDto {
  @IsString()
  name: string;

  @IsString()
  dataCategory: string;

  @IsInt()
  retentionDays: number;

  @IsOptional()
  @IsString()
  legalBasis?: string;

  @IsOptional()
  @IsEnum(DispositionAction)
  dispositionAction?: DispositionAction;

  @IsOptional()
  @IsInt()
  notificationDaysBefore?: number;

  @IsOptional()
  @IsInt()
  softDeletePeriodDays?: number;

  @IsOptional()
  @IsBoolean()
  autoExecute?: boolean;

  @IsString()
  createdBy: string;
}
