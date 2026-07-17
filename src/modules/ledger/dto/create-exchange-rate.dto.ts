import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsString } from 'class-validator';
import { FXRateSourceType } from '../entities/ledger-exchange-rate.entity';

export class CreateExchangeRateDto {
  @ApiProperty({ example: 'USD', description: 'Moneda origen (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  fromCurrency: string;

  @ApiProperty({ example: 'EUR', description: 'Moneda destino (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  toCurrency: string;

  @ApiProperty({ example: 0.92, description: 'Tasa de compra' })
  @IsNumber()
  rateBuy: number;

  @ApiProperty({ required: false, example: 0.94, description: 'Tasa de venta' })
  @IsOptional()
  @IsNumber()
  rateSell?: number;

  @ApiProperty({ example: '2026-07-17', description: 'Fecha de la tasa' })
  @IsDateString()
  rateDate: string;

  @ApiProperty({ required: false, enum: FXRateSourceType, default: FXRateSourceType.ECB })
  @IsOptional()
  @IsEnum(FXRateSourceType)
  sourceType?: FXRateSourceType;

  @ApiProperty({ required: false, description: 'Referencia de la fuente' })
  @IsOptional()
  @IsString()
  sourceReference?: string;
}
