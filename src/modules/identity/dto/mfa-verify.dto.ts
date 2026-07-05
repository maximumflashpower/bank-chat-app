import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaVerifyDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsUUID()
  factorId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;
}
