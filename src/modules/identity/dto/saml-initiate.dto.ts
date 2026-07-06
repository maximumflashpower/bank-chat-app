import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SamlInitiateDto {
  @ApiProperty({ example: 'company-idp', required: false })
  @IsString()
  @IsOptional()
  idpIdentifier?: string;

  @ApiProperty({ example: 'sp-default' })
  @IsString()
  relayState?: string;
}
