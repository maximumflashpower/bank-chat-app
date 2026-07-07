import { IsString, IsNotEmpty, IsEnum, IsInt, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GlAccountType } from '../entities/gl-account-type.enum';
import { NormalBalance } from '../entities/normal-balance.enum';

export class CreateChartOfAccountsDto {
  @ApiProperty({ example: '1000-001' })
  @IsString()
  @IsNotEmpty()
  account_code: string;

  @ApiProperty({ example: 'Cash - Operating Account' })
  @IsString()
  @IsNotEmpty()
  account_name: string;

  @ApiProperty({ enum: GlAccountType })
  @IsEnum(GlAccountType)
  account_type: GlAccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parent_account_id?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  level?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_postable?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_control_account?: boolean;

  @ApiProperty({ enum: NormalBalance })
  @IsEnum(NormalBalance)
  normal_balance: NormalBalance;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  xbrl_tag?: string;
}
