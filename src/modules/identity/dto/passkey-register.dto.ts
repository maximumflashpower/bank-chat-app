import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PasskeyRegisterStartDto {
  @ApiPropertyOptional({ example: 'MacBook Pro TouchID' })
  @IsOptional()
  @IsString()
  nickname?: string;
}

export class PasskeyRegisterFinishDto {
  @ApiProperty({ example: {} })
  @IsObject()
  attestationResponse: Record<string, any>;

  @ApiPropertyOptional({ example: 'MacBook Pro TouchID' })
  @IsOptional()
  @IsString()
  nickname?: string;
}

export class PasskeyAuthVerifyDto {
  @ApiProperty({ example: {} })
  @IsObject()
  assertionResponse: Record<string, any>;
}

export class PasskeyRenameDto {
  @ApiProperty({ example: 'YubiKey 5C' })
  @IsString()
  nickname: string;
}
