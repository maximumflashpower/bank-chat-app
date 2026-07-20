import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { NightDepositType } from '../entities/teller-night-deposit.entity';

export class NightDepositDto {
  @ApiProperty({ example: 'ND-2026-001234', description: 'Referencia única del depósito' })
  @IsString()
  @IsNotEmpty()
  depositReference: string;

  @ApiProperty({ example: 'branch-uuid-123', description: 'ID de sucursal' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'customer-uuid-456', description: 'ID del cliente' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'account-uuid-789', required: false, description: 'Cuenta destino (opcional al recibir, obligatorio al procesar)' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiProperty({ enum: NightDepositType, description: 'Tipo de depósito nocturno' })
  @IsEnum(NightDepositType)
  depositType: NightDepositType;

  @ApiProperty({ example: 'BAG-LOCK-001', required: false, description: 'Identificador de bolsa/cerradura' })
  @IsOptional()
  @IsString()
  bagIdentifier?: string;

  @ApiProperty({ example: 3500.00, required: false, description: 'Monto en efectivo declarado por el cliente' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  statedCashAmount?: number;

  @ApiProperty({ example: 12, required: false, description: 'Cantidad de cheques declarados' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  statedCheckCount?: number;

  @ApiProperty({ example: 8500.00, required: false, description: 'Monto total en cheques declarado' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  statedCheckTotal?: number;

  @ApiProperty({ example: 'USD', required: false, description: 'Moneda (default: USD)' })
  @IsOptional()
  @IsString()
  currencyCode?: string;
}
