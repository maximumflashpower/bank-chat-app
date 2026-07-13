import { IsString, IsEnum, IsOptional } from 'class-validator';
import { SoxTestResult } from '../entities/sox-test-result.enum';
import { SoxAssertionStatus } from '../entities/sox-assertion-status.enum';

export class CreateSoxControlDto {
  @IsString()
  controlIdRef: string;

  @IsString()
  controlDescription: string;

  @IsString()
  riskCategory: string;

  @IsOptional()
  @IsString()
  processOwnerId?: string;

  @IsString()
  testFrequency: string;

  @IsString()
  testMethod: string;
}
