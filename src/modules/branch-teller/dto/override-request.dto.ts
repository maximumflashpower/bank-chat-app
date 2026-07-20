import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class OverrideRequestDto {
  @ApiProperty({ example: 'tx-ref-12345', description: 'Referencia de la transacción' })
  @IsString()
  @IsNotEmpty()
  transactionReference: string;

  @ApiProperty({ example: 'withdrawal', description: 'Tipo de operación' })
  @IsString()
  @IsNotEmpty()
  operationType: string;

  @ApiProperty({ example: 15000.00, description: 'Monto que requiere override' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'WITHDRAWAL_LIMIT_EXCEEDED', description: 'Razón del override' })
  @IsString()
  @IsNotEmpty()
  reasonCode: string;

  @ApiProperty({ required: false, description: 'Descripción adicional de la situación' })
  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @ApiProperty({ example: 'a1b2c3d4-...', description: 'ID del cajero solicitante' })
  @IsUUID()
  @IsNotEmpty()
  requestedByUserId: string;

  @ApiProperty({ example: 'd4f7a1b2-...', description: 'ID de sucursal' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;
}
