import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class DrawerCloseDto {
  @ApiProperty({ example: 'a1b2c3d4-...', description: 'ID del drawer a cerrar' })
  @IsUUID()
  @IsNotEmpty()
  drawerId: string;

  @ApiProperty({ example: 4500.00, description: 'Saldo total contado al cierre' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  closingBalanceTotal: number;

  @ApiProperty({
    example: { '100': 18, '50': 28, '20': 45, '10': 95, '5': 190, '1': 290 },
    description: 'Desglose por denominación al cierre (cantidad de billetes/monedas)'
  })
  @IsOptional()
  denominationBreakdownClose?: Record<string, number>;

  @ApiProperty({ example: 0.50, required: false, description: 'Diferencia (positivo=sobrante, negativo=faltante)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  varianceAmount?: number;

  @ApiProperty({ required: false, description: 'Notas del cajero al cerrar turno' })
  @IsOptional()
  @IsString()
  closingNotes?: string;

  @ApiProperty({ required: false, description: 'ID del supervisor testigo (si requiere override por varianza)' })
  @IsOptional()
  @IsUUID()
  overrideApprovedBy?: string;
}
