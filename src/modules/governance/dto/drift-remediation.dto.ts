import { IsString, IsOptional } from 'class-validator';

export class DriftRemediationDto {
  @IsOptional()
  @IsString()
  remediationAction?: string;
}
