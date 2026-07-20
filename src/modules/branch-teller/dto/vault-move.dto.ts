import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { VaultMovementType } from '../entities/teller-vault-movement.entity';

export class VaultMoveDto {
  @ApiProperty({ example: 'vault-uuid-123', description: 'ID de la caja fuerte origen' })
  @IsUUID()
  @IsNotEmpty()
  vaultId: string;

  @ApiProperty({ enum: VaultMovementType, description: 'Tipo de movimiento' })
  @IsEnum(VaultMovementType)
  movementType: VaultMovementType;

  @ApiProperty({ example: 25000.00, description: 'Monto total a mover' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amountTotal: number;

  @ApiProperty({
    example: { '100': 100, '50': 200, '20': 250 },
    required: false,
    description: 'Desglose por denominación (opcional)'
  })
  @IsOptional()
  denominationBreakdown?: Record<string, number>;

  @ApiProperty({ example: 'USD', required: false, description: 'Moneda (default: USD)' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiProperty({ example: 'branch-src-uuid', required: false, description: 'ID de sucursal origen' })
  @IsOptional()
  @IsUUID()
  sourceBranchId?: string;

  @ApiProperty({ example: 'branch-dst-uuid', required: false, description: 'ID de sucursal destino' })
  @IsOptional()
  @IsUUID()
  destinationBranchId?: string;

  @ApiProperty({ required: false, description: 'Descripción del propósito' })
  @IsOptional()
  @IsString()
  purposeDescription?: string;

  @ApiProperty({ example: 'user-uuid-req', description: 'ID del usuario que solicita' })
  @IsUUID()
  @IsNotEmpty()
  requestedByUserId: string;
}
