import { IsString, IsEnum, IsOptional, IsObject, MaxLength } from 'class-validator';
import { PolicyDomain } from '../entities/policy-domain.enum';
import { PolicyLanguage } from '../entities/policy-language.enum';
import { Severity } from '../entities/severity.enum';
import { EnforcementMode } from '../entities/enforcement-mode.enum';

export class CreatePolicyDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PolicyDomain)
  domain: PolicyDomain;

  @IsOptional()
  @IsEnum(PolicyLanguage)
  language?: PolicyLanguage;

  @IsString()
  codeContent: string;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @IsEnum(EnforcementMode)
  enforcementMode?: EnforcementMode;

  @IsOptional()
  @IsObject()
  applicableScope?: Record<string, any>;
}
