import { IsString, IsOptional, IsUUID } from 'class-validator';

export class FileDeclarationDto {
  @IsOptional()
  @IsString()
  filingReference?: string;

  @IsOptional()
  @IsUUID()
  submittedBy?: string;

  @IsOptional()
  @IsString()
  filingFormat?: string;
}
