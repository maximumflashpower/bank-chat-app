import { IsString, IsEnum, IsOptional, IsObject, IsNumber } from 'class-validator';

export class CreateScenarioDto {
  @IsString()
  scenarioName: string;

  @IsString()
  scenarioType: string;

  @IsString()
  reportingCycle: string;

  @IsOptional()
  @IsObject()
  macroAssumptions?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  minimumCapitalThreshold?: number;

  @IsOptional()
  @IsObject()
  modelVersioning?: Record<string, any>;

  @IsOptional()
  @IsString()
  narrative?: string;
}

export class RunStressTestDto {
  @IsString()
  stressTestId: string;

  @IsOptional()
  @IsObject()
  macroShocks?: Record<string, number>;

  @IsOptional()
  @IsString()
  creditLossModelVersion?: string;
}

export class ReviewStressTestDto {
  @IsString()
  stressTestId: string;

  @IsOptional()
  @IsString()
  narrativeExplanation?: string;
}
