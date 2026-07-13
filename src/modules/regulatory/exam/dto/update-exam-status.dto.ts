import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ExamStatus } from '../entities/exam-status.enum';

export class UpdateExamStatusDto {
  @IsEnum(ExamStatus)
  status: ExamStatus;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;
}
