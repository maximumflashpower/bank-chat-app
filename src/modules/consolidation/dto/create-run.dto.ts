import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRunDto {
  @ApiProperty({ required: false, example: 'CONS-2026-Q3' })
  @IsOptional()
  @IsString()
  runCode?: string;

  @ApiProperty()
  @IsString()
  parentEntityId: string;

  @ApiProperty()
  @IsDateString()
  reportingPeriodStart: string;

  @ApiProperty()
  @IsDateString()
  reportingPeriodEnd: string;

  @ApiProperty({ required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  reportingCurrency?: string;

  @ApiProperty()
  @IsString()
  preparedBy: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  exchangeRateDate?: string;
}
