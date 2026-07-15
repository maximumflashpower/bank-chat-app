import {
  IsBoolean, IsOptional, IsObject, IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConsentDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  granted?: boolean;

  @ApiProperty({ example: { newsletter: false, analytics: true }, required: false })
  @IsObject()
  @IsOptional()
  granularity?: Record<string, boolean>;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  revokedAt?: string;
}
