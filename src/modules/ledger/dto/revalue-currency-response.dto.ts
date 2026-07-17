import { ApiProperty } from '@nestjs/swagger';

export class RevalueCurrencyResponseDto {
  @ApiProperty({ description: 'Fecha de revaluación' })
  revaluationDate: Date;

  @ApiProperty({ description: 'Divisas revaluadas' })
  currenciesRevalued: string[];

  @ApiProperty({ description: 'Total ganancia/pérdida' })
  totalGainLoss: number;

  @ApiProperty({ description: 'Entradas contables creadas' })
  entriesCreated: number;
}
