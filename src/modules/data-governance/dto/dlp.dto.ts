import { IsString, IsArray, IsEnum, IsOptional } from 'class-validator';
import { DlpAction, DlpSeverity } from '../entities/datagov-dlp-rule.entity';

export class CreateDlpRuleDto {
  @IsString()
  ruleName: string;

  @IsString()
  detectionPattern: string;

  @IsArray()
  @IsString({ each: true })
  dataTypesMatched: string[];

  @IsEnum(DlpAction)
  action: DlpAction;

  @IsArray()
  @IsString({ each: true })
  channelsApplied: string[];

  @IsOptional()
  @IsEnum(DlpSeverity)
  severity?: DlpSeverity;
}

export class EvaluateContentDto {
  @IsString()
  content: string;

  @IsString()
  channel: string;

  @IsString()
  userId: string;
}

export class ApproveExceptionDto {
  @IsString()
  approvalId: string;

  @IsString()
  justification: string;
}
