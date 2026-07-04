import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { DecisionResult } from '../entities/decision-result.enum';

export class DecisionQueryDto {
  @IsOptional()
  @IsString()
  policyId?: string;

  @IsOptional()
  @IsEnum(DecisionResult)
  decisionResult?: DecisionResult;

  @IsOptional()
  @IsString()
  evaluatedEntityType?: string;

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}
