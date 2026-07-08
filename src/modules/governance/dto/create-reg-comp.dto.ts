import { IsEnum, IsString, IsOptional, IsObject, IsDateString, IsBoolean, IsNumber } from 'class-validator';
import { RegCompType } from '../entities/reg-comp-type.enum';

export class CreateRegCompDto {
  @IsEnum(RegCompType)
  type: RegCompType;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  relatedPolicyId?: string;

  @IsOptional()
  @IsString()
  relatedFrameworkId?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsBoolean()
  isAttested?: boolean;
}
