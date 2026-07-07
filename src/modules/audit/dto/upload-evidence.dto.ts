import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EvidenceType } from '../entities/evidence-type.enum';

export class UploadEvidenceDto {

  @ApiProperty({ description: 'ID del caso forense' })
  @IsString()
  caseId: string;
  @ApiProperty({ enum: EvidenceType })
  @IsEnum(EvidenceType)
  itemType: EvidenceType;

  @ApiProperty({ example: 'auth-service' })
  @IsString()
  sourceSystem: string;

  @ApiProperty({ example: '/var/log/auth.log' })
  @IsString()
  collectedFrom: string;

  @ApiProperty({ example: 'manual' })
  @IsString()
  collectionMethod: string;

  @ApiProperty({ example: 'a7f3b2c1d4e5f6a7b8c9d0e1f2a3b4c5' })
  @IsString()
  fileHashMd5: string;

  @ApiProperty({ example: 'a7f3b2c1...' })
  @IsString()
  fileHashSha256: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  storageLocation?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  retentionUntil?: string;
}
