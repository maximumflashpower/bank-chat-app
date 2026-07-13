import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SoxTestResult } from '../entities/sox-test-result.enum';

export class TestSoxControlDto {
  @IsEnum(SoxTestResult)
  result: SoxTestResult;

  @IsOptional()
  @IsString()
  evidenceLink?: string;

  @IsOptional()
  @IsString()
  testedBy?: string;
}
