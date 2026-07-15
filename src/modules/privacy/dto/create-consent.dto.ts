import {
  IsEnum, IsBoolean, IsOptional, IsString, IsObject, IsIP, IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConsentPurpose, LegalBasis } from '../entities/privacy-consent.entity';

export class CreateConsentDto {
  @ApiProperty({ enum: ConsentPurpose, example: ConsentPurpose.MARKETING })
  @IsEnum(ConsentPurpose)
  purpose: ConsentPurpose;

  @ApiProperty({ enum: LegalBasis, example: LegalBasis.CONSENT })
  @IsEnum(LegalBasis)
  legalBasis: LegalBasis;

  @ApiProperty({ example: true })
  @IsBoolean()
  granted: boolean;

  @ApiProperty({ example: { newsletter: true, analytics: false, advertising: true }, required: false })
  @IsObject()
  @IsOptional()
  granularity?: Record<string, boolean>;

  @ApiProperty({ example: '1.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ example: '192.168.1.1', required: false })
  @IsIP('4')
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({ example: 'Mozilla/5.0...', required: false })
  @IsString()
  @IsOptional()
  userAgent?: string;
}
