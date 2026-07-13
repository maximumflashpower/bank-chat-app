import { IsString, IsBoolean, IsEnum, IsOptional, IsArray } from 'class-validator';
import { EthicsCaseType } from '../entities/ethics-case-type.enum';

export class SubmitWhistleblowerDto {
  @IsEnum(EthicsCaseType)
  caseType: EthicsCaseType;

  @IsBoolean()
  anonymous: boolean;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  encryptedReporterId?: string;

  @IsOptional()
  @IsArray()
  evidenceAttachments?: string[];

  @IsOptional()
  @IsString()
  severity?: string;
}
