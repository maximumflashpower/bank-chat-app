import { IsString, IsNumber } from 'class-validator';

export class FxRateQueryDto {
  @IsString()
  fromCurrency: string;

  @IsString()
  toCurrency: string;

  @IsNumber()
  amount: number;
}
