import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class FxExchangeDto {
  @ApiProperty({ example: 'd4f7a1b2-...', description: 'ID de sucursal' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'e5a8b2c3-...', description: 'ID del cajero' })
  @IsUUID()
  @IsNotEmpty()
  tellerUserId: string;

  @ApiProperty({ example: 'f6b9c3d4-...', description: 'ID del cliente' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'a1b2c3d5-...', required: false, description: 'Cuenta de origen (opcional)' })
  @IsOptional()
  @IsUUID()
  sourceAccountId?: string;

  @ApiProperty({ example: 'a1b2c3d6-...', required: false, description: 'Cuenta destino (opcional)' })
  @IsOptional()
  @IsUUID()
  destinationAccountId?: string;

  @ApiProperty({ example: 'EUR', description: 'Moneda que entrega el cliente' })
  @IsString()
  @IsNotEmpty()
  currencyFrom: string;

  @ApiProperty({ example: 'USD', description: 'Moneda que recibe el cliente' })
  @IsString()
  @IsNotEmpty()
  currencyTo: string;

  @ApiProperty({ example: 1000.00, description: 'Monto en moneda origen' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amountFrom: number;

  @ApiProperty({ example: 1.0875, description: 'Tasa de cambio aplicada (live rate)' })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  exchangeRate: number;

  @ApiProperty({ example: 1087.50, description: 'Monto resultante en moneda destino' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountTo: number;

  @ApiProperty({ example: 5.00, required: false, description: 'Comisión por servicio FX' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  commissionAmount?: number;

  @ApiProperty({ required: false, description: 'Notas de la operación' })
  @IsOptional()
  @IsString()
  transactionNotes?: string;
}
