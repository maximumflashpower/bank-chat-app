import { IsEnum, IsString, IsArray, IsEmail, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ContactMethod {
  EMAIL_BACKUP = 'email_backup',
  TRUSTED_CONTACTS = 'trusted_contacts',
}

export class RecoveryInitiateDto {
  @ApiProperty({ enum: ContactMethod })
  @IsEnum(ContactMethod)
  contactMethod: ContactMethod;

  @ApiProperty({ example: ['alice@example.com', 'bob@example.com'] })
  @IsArray()
  @IsEmail({}, { each: true })
  @MaxLength(320)
  contactAddresses: string[];

  @ApiProperty({ type: () => String, minLength: 20 })
  @IsString()
  justification: string;
}
