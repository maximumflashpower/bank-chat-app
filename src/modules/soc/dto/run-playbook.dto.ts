import { IsString, IsOptional, IsUUID } from 'class-validator';

export class RunPlaybookDto {
  @IsUUID()
  playbookId: string;

  @IsUUID()
  @IsOptional()
  incidentId?: string;
}
