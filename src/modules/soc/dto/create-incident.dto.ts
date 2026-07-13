import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { IncidentClassification } from '../entities/soc-incident.entity';
import { IncidentPriority } from '../entities/soc-incident.entity';

export class CreateIncidentDto {
  @IsString()
  title: string;

  @IsEnum(IncidentClassification)
  classification: IncidentClassification;

  @IsString()
  severity: string;

  @IsEnum(IncidentPriority)
  @IsOptional()
  priority?: IncidentPriority;

  @IsString()
  @IsOptional()
  impactSummary?: string;

  @IsString()
  @IsOptional()
  assignedLead?: string;

  @IsNumber()
  @IsOptional()
  slaResponseHours?: number;
}
