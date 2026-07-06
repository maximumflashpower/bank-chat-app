import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TrustAction {
  MARK_TRUSTED = 'mark_trusted',
  MARK_UNTRUSTED = 'mark_untrusted',
  REVOKE = 'revoke',
}

export class DeviceTrustLabelDto {
  @ApiProperty({ example: 'laptop-chrome-win11' })
  @IsString()
  @MaxLength(255)
  deviceId: string;

  @ApiProperty({ enum: TrustAction })
  @IsEnum(TrustAction)
  action: TrustAction;

  @ApiProperty({ type: () => String, required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  deviceTypeLabel?: string;

  @ApiProperty({ type: () => String, required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
