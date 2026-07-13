import { IsString, IsOptional, IsArray } from 'class-validator';

export class CompileExamPackageDto {
  @IsString()
  examId: string;

  @IsOptional()
  @IsArray()
  documentIds?: string[];
}
