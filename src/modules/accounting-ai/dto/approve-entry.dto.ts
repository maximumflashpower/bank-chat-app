import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class ApproveEntryDto {
  @IsOptional()
  @IsString()
  approverComments?: string;

  @IsOptional()
  @IsBoolean()
  humanCorrectionApplied?: boolean;

  @IsOptional()
  @IsObject()
  correctedFields?: any;

  @IsOptional()
  @IsString()
  approvedBy?: string;
}
