import { IsString, IsOptional } from 'class-validator';

export class FlagFraudDto {
  @IsString()
  flaggedBy: string;

  @IsOptional()
  @IsString()
  priorityLevel?: string;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
