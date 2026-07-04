import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNotEmpty, Length } from 'class-validator';
import { AccountType } from '../entities/account-type.enum';

export class CreateAccountDto {
  @ApiProperty({ enum: AccountType, example: AccountType.CHECKING })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty({ example: 'Cuenta principal', required: false })
  @IsString()
  @IsOptional()
  alias?: string;

  @ApiProperty({ example: 'MXN', required: false })
  @IsString()
  @Length(3, 3)
  @IsOptional()
  currency?: string;
}
