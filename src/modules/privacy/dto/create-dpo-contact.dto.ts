import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDpoContactDto {
  @ApiProperty({ description: 'Nombre completo del DPO' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Email de contacto' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Teléfono', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Organización' })
  @IsString()
  organization: string;

  @ApiProperty({ description: 'Jurisdicción', required: false })
  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @ApiProperty({ description: 'Es DPO principal', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
