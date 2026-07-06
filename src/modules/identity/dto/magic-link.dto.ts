import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MagicLinkRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'return-url' })
  @IsString()
  @IsOptional()
  returnUrl?: string;
}

export class MagicLinkVerifyDto {
  @ApiProperty({ example: 'abc123xyz789' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
