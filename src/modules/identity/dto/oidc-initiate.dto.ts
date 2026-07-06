import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OidcProvider {
  MICROSOFT = 'microsoft',
  GOOGLE = 'google',
  OKTA = 'okta',
  AWS = 'aws',
}

export class OidcInitiateDto {
  @ApiProperty({ enum: OidcProvider, example: OidcProvider.MICROSOFT })
  @IsEnum(OidcProvider)
  provider: OidcProvider;

  @ApiProperty({ example: 'read-write', required: false })
  @IsString()
  @IsOptional()
  scopeOverride?: string;

  @ApiProperty({ example: 'sp-default', required: false })
  @IsString()
  @IsOptional()
  redirectUriOverride?: string;
}
