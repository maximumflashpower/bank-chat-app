import { IsString, IsEnum, IsBoolean, IsObject, IsOptional } from 'class-validator';
import { PlaybookTrigger, PlaybookExecutionMode } from '../entities/soar-playbook.entity';

export class CreatePlaybookDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PlaybookTrigger)
  playbookTrigger: PlaybookTrigger;

  @IsObject()
  playbookSteps: Record<string, unknown>;

  @IsEnum(PlaybookExecutionMode)
  @IsOptional()
  executionMode?: PlaybookExecutionMode;

  @IsBoolean()
  @IsOptional()
  approvalRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
