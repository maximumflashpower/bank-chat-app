import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyBackupCodeDto {
  @ApiProperty({ example: 'A1B2C3D4E5' })
  @IsString()
  code: string;
}

export class RegenerateBackupCodesDto {
  @ApiPropertyOptional({ example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  factorId?: string;
}
