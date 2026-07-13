import { IsString, IsOptional } from 'class-validator';

export class ReviewCoiDto {
  @IsString()
  coiId: string;

  @IsString()
  approvalStatus: string;

  @IsOptional()
  @IsString()
  mitigationPlan?: string;
}
