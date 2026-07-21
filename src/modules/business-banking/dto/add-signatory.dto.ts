import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { AuthorizationLevel } from '../entities/business-signatory.entity';

export class AddSignatoryDto {
  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roleTitle?: string;

  @ApiProperty({ enum: AuthorizationLevel })
  @IsEnum(AuthorizationLevel)
  authorizationLevel: AuthorizationLevel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  individualLimitAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  requiresCosignAbove?: number;
}
