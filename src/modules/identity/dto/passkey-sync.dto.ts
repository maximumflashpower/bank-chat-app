import { IsUUID, IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PasskeySyncDto {
  @ApiProperty({ type: () => String })
  @IsUUID()
  passkeyId: string;

  @ApiProperty({ example: 'laptop-chrome-win11' })
  @IsString()
  @MaxLength(255)
  deviceId: string;

  @ApiPropertyOptional({ type: () => Boolean, default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
