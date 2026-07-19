import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class RedeemDto {
  @ApiProperty({ example: 'uuid-enrollment', description: 'ID de inscripción' })
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ example: 'uuid-catalog-item', description: 'Ítem del catálogo' })
  @IsUUID()
  @IsNotEmpty()
  catalogItemId: string;

  @ApiProperty({ example: 'uuid-reference', description: 'Referencia externa opcional' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class CashbackRedemptionDto {
  @ApiProperty({ example: 'uuid-enrollment', description: 'ID de inscripción' })
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ example: 'uuid-customer', description: 'ID del cliente' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'uuid-program', description: 'ID del programa' })
  @IsUUID()
  @IsNotEmpty()
  programId: string;

  @ApiProperty({ example: 500, description: 'Cantidad de puntos' })
  @IsNumber()
  @IsNotEmpty()
  points: number;

  @ApiProperty({ example: 'uuid-account', description: 'ID de cuenta destino' })
  @IsUUID()
  @IsNotEmpty()
  accountId: string;
}
