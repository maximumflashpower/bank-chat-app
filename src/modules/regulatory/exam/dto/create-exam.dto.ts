import { IsString, IsDateString, IsEnum, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ExamType } from '../entities/exam-type.enum';

export class CreateExamDto {
  @IsString()
  examinerAgency: string;

  @IsEnum(ExamType)
  examType: ExamType;

  @IsString()
  scope: string;

  @IsDateString()
  receivedDate: string;

  @IsDateString()
  responseDeadline: string;

  @IsOptional()
  @IsArray()
  assignedTeam?: string[];

  @IsOptional()
  @IsString()
  priority?: string;
}
