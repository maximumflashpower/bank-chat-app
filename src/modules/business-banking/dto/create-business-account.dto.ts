import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BusinessAccountType, BusinessAccountTier, KycCorporateStatus } from '../entities/business-account.entity';

export class CreateBusinessAccountDto {
  @ApiProperty({ description: 'ID de la organización' })
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @ApiProperty({ enum: BusinessAccountType })
  @IsEnum(BusinessAccountType)
  accountType: BusinessAccountType;

  @ApiProperty({ enum: BusinessAccountTier })
  @IsEnum(BusinessAccountTier)
  accountTier: BusinessAccountTier;

  @ApiProperty({ required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  overdraftLineCredit?: number;
}
