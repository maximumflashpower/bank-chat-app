import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PublishPolicyVersionDto {
  @ApiProperty({ description: 'Usuario que publica la versión' })
  @IsString()
  publishedBy: string;
}
