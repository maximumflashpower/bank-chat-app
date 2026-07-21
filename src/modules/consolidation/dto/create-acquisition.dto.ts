import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAcquisitionDto {
  @ApiProperty({ required: false, example: 'ACQ-2026-001' })
  @IsOptional()
  @IsString()
  acquisitionCode?: string;

  @ApiProperty()
  @IsString()
  acquiringEntityId: string;

  @ApiProperty()
  @IsString()
  targetCompanyName: string;

  @ApiProperty({ example: 'MX' })
  @IsString()
  targetCountry: string;

  @ApiProperty()
  @IsNumber()
  transactionValue: number;

  @ApiProperty({ required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  transactionCurrency?: string;

  @ApiProperty({ example: 75 })
  @IsNumber()
  ownershipAcquiredPct: number;
}
