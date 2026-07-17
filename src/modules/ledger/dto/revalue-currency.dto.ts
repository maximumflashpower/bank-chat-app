import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class RevalueCurrencyDto {
  @ApiProperty({ example: '2026-07-17', description: 'Fecha de revaluación' })
  @IsDateString()
  revalueDate: string;

  @ApiProperty({ required: false, example: 'EUR', description: 'Moneda específica a revaluar' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false, example: 'USD', description: 'Moneda base de reporte' })
  @IsOptional()
  @IsString()
  baseCurrency?: string;
}
