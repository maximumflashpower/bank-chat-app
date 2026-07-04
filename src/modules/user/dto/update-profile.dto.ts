import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Juan', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ example: 'Pérez', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ example: '1990-05-15', required: false })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiProperty({ example: 'male', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  gender?: string;

  @ApiProperty({ example: 'CDMX', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ example: 'Mexico', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiProperty({ example: 'Software developer', required: false })
  @IsString()
  @IsOptional()
  bio?: string;
}
