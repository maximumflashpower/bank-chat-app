import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { SensitivityLabel, PIIType } from '../entities/datagov-classification.entity';

export class AutoClassifyDto {
  @IsString()
  entityType: string;

  @IsString()
  entityIdentifier: string;

  @IsOptional()
  @IsString()
  sampleContent?: string;
}

export class ManualClassifyDto {
  @IsString()
  entityType: string;

  @IsString()
  entityIdentifier: string;

  @IsEnum(SensitivityLabel)
  sensitivityLabel: SensitivityLabel;

  @IsOptional()
  @IsEnum(PIIType)
  piiType?: PIIType;

  @IsOptional()
  @IsString()
  classifiedBy?: string;
}

export class OverrideClassificationDto {
  @IsEnum(SensitivityLabel)
  newLabel: SensitivityLabel;

  @IsString()
  stewardId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
