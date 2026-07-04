import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ViolationStatus } from '../entities/violation-status.enum';

export class ResolveViolationDto {
  @IsEnum(ViolationStatus)
  status: ViolationStatus;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @IsOptional()
  @IsString()
  waivedJustification?: string;

  @IsOptional()
  @IsDateString()
  waiverExpiresAt?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
