import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { TellerTransactionType } from '../entities/teller-transaction.entity';

export class TransactDto {
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

  @ApiProperty({ enum: TellerTransactionType, description: 'Tipo de transacción' })
  @IsEnum(TellerTransactionType)
  transactionType: TellerTransactionType;

  @ApiProperty({ example: 500.00, description: 'Monto principal' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amountPrincipal: number;

  @ApiProperty({ example: 5.00, required: false, description: 'Comisión cobrada' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  feeCharged?: number;

  @ApiProperty({ example: 1.0, required: false, description: 'Tasa FX aplicada' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  foreignExchangeRate?: number;

  @ApiProperty({ required: false, description: 'Cuenta origen' })
  @IsOptional()
  @IsUUID()
  sourceAccountId?: string;

  @ApiProperty({ required: false, description: 'Cuenta destino' })
  @IsOptional()
  @IsUUID()
  destinationAccountId?: string;

  @ApiProperty({ required: false, description: 'Referencia externa' })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiProperty({ required: false, description: 'Notas del cajero' })
  @IsOptional()
  @IsString()
  tellerNotes?: string;
}
