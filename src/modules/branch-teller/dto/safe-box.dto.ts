import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, IsBoolean } from 'class-validator';
import { SafeDepositBoxStatus } from '../entities/teller-safe-deposit-box.entity';

export class SafeBoxRentDto {
  @ApiProperty({ example: 'box-number-ABC-001', description: 'Número/ID de caja de seguridad' })
  @IsString()
  @IsNotEmpty()
  boxNumber: string;

  @ApiProperty({ example: 'branch-uuid-123', description: 'ID de sucursal' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'customer-uuid-456', description: 'ID del cliente rentador' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'user-uuid-789', required: false, description: 'ID de cotenante (opcional)' })
  @IsOptional()
  @IsUUID()
  jointRenterId?: string;

  @ApiProperty({ example: 'account-uuid-000', description: 'Cuenta de facturación para pago anual' })
  @IsUUID()
  @IsNotEmpty()
  billingAccountId: string;

  @ApiProperty({ example: 'USD', required: false, description: 'Moneda (default: USD)' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiProperty({ example: true, required: false, description: 'Auto-renovación anual (default: true)' })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

export class SafeBoxAccessDto {
  @ApiProperty({ example: 'box-uuid-123', description: 'ID de la caja de seguridad' })
  @IsUUID()
  @IsNotEmpty()
  safeDepositBoxId: string;

  @ApiProperty({ example: 'branch-uuid-456', description: 'ID de sucursal' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'customer-uuid-789', description: 'ID del cliente accediendo' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'admin-uuid-000', required: false, description: 'ID del empleado testigo (dual control)' })
  @IsOptional()
  @IsUUID()
  witnessUserId?: string;

  @ApiProperty({ required: false, description: 'Propósito del acceso' })
  @IsOptional()
  @IsString()
  accessPurpose?: string;
}

export class SafeBoxReturnDto {
  @ApiProperty({ example: 'box-uuid-123', description: 'ID de la caja de seguridad' })
  @IsUUID()
  @IsNotEmpty()
  safeDepositBoxId: string;

  @ApiProperty({ example: 'customer-uuid-456', description: 'ID del cliente que devuelve' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ required: false, description: 'Notas al devolver contents' })
  @IsOptional()
  @IsString()
  returnNotes?: string;
}
