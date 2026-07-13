import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum TicketSystem {
  JIRA = 'JIRA',
  SERVICENOW = 'SERVICENOW',
  ITSM = 'ITSM',
}

export class CreateTicketDto {
  @IsEnum(TicketSystem)
  system: TicketSystem;

  @IsString()
  @IsOptional()
  externalProjectId?: string;

  @IsString()
  @IsOptional()
  assigneeEmail?: string;
}
