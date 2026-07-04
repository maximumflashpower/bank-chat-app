import { IsObject, IsOptional, IsString, IsEnum } from 'class-validator';
import { PolicyDomain } from '../entities/policy-domain.enum';

export class EvaluateRequestDto {
  @IsOptional()
  @IsEnum(PolicyDomain)
  domain?: PolicyDomain;

  @IsObject()
  input: Record<string, any>;

  @IsOptional()
  @IsString()
  evaluatedEntityType?: string;

  @IsOptional()
  @IsString()
  evaluatedEntityId?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}
