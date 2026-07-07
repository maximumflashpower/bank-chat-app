import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  documentType: string;

  @IsString()
  fileStorageUrl: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  format?: string;
}
