import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MfaEnrollType {
  TOTP = 'totp',
  HOTP = 'hotp',
  HARDWARE = 'hardware',
  WEBAUTHN = 'webauthn',
}

export class MfaEnrollDto {
  @ApiProperty({ enum: MfaEnrollType, example: 'totp' })
  @IsEnum(MfaEnrollType)
  type: MfaEnrollType;

  @ApiPropertyOptional({ example: 'encrypted_secret_here' })
  @IsString()
  @IsOptional()
  encryptedSecret?: string;
}
