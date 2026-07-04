import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, IsEmail, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '+525512345678', description: 'Phone number with country code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+\d{10,15}$/, { message: 'Phone must include country code (e.g. +525512345678)' })
  phoneNumber: string;

  @ApiProperty({ example: 'juan@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Juan', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Pérez', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;
}
