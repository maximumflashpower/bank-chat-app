import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MfaType } from '../entities/mfa-type.enum';

export class MfaSetupDto {
  @ApiProperty({ enum: MfaType, example: MfaType.TOTP })
  @IsEnum(MfaType)
  type: MfaType;

  @ApiPropertyOptional({ example: 'Google Authenticator' })
  @IsOptional()
  @IsString()
  label?: string;
}
