import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class DrawerOpenDto {
  @ApiProperty({ example: 'd4f7a1b2-...', description: 'ID de sucursal' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'e5a8b2c3-...', description: 'ID del cajero' })
  @IsUUID()
  @IsNotEmpty()
  tellerUserId: string;

  @ApiProperty({ example: 'DRAWER-001', description: 'Número de drawer asignado' })
  @IsString()
  @IsNotEmpty()
  drawerNumber: string;

  @ApiProperty({ example: 5000.00, description: 'Saldo inicial total' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  openingBalanceTotal: number;

  @ApiProperty({ 
    example: { '100': 20, '50': 30, '20': 50, '10': 100, '5': 200, '1': 300 },
    description: 'Desglose por denominación (cantidad de billetes/monedas)'
  })
  @IsOptional()
  denominationBreakdown?: Record<string, number>;

  @ApiProperty({ example: 10000.00, description: 'Límite máximo de efectivo permitido' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxCashLimit: number;

  @ApiProperty({ example: 'USD', required: false, description: 'Moneda (default: USD)' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiProperty({ required: false, description: 'Notas de apertura' })
  @IsOptional()
  @IsString()
  openingNotes?: string;
}
