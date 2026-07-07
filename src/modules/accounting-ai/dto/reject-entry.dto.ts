import { IsString, IsOptional } from 'class-validator';

export class RejectEntryDto {
  @IsString()
  rejectedReason: string;

  @IsOptional()
  @IsString()
  rejectedBy?: string;
}
