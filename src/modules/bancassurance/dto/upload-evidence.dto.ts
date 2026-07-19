import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class UploadEvidenceDto {
  @ApiProperty({ example: 'photo' })
  @IsString()
  @IsNotEmpty()
  evidenceType: string;

  @ApiProperty({ example: '/uploads/evidence/claim-123/photo.jpg' })
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileHash?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  fileSizeBytes?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  uploadedBy?: string;
}
