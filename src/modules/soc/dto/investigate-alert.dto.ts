import { IsString, IsOptional } from 'class-validator';

export class InvestigateAlertDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
