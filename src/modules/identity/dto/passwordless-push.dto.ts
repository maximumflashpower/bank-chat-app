import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordlessPushRegisterDto {
  @ApiProperty({ example: 'My Phone' })
  @IsString()
  deviceName: string;

  @ApiProperty({ example: 'ios' })
  @IsString()
  platform: string;

  @ApiProperty({ example: '{"token": "xxx"}' })
  @IsString()
  pushToken: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
