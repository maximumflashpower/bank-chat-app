import { IsEnum, IsString, IsOptional, IsNumber } from 'class-validator';
import { FrameworkName } from '../entities/framework-name.enum';

export class FrameworkMapDto {
  @IsEnum(FrameworkName)
  frameworkName: FrameworkName;

  @IsString()
  frameworkControl: string;

  @IsString()
  policyId: string;

  @IsOptional()
  @IsNumber()
  coveragePct?: number;

  @IsOptional()
  @IsString()
  evidenceArtifact?: string;
}
