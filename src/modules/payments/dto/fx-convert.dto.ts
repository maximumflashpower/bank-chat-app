import { IsString, IsNumber, IsUUID } from 'class-validator';

export class FxConvertDto {
  @IsString()
  fromCurrency: string;

  @IsString()
  toCurrency: string;

  @IsNumber()
  amount: number;

  @IsUUID()
  instructionId: string;

  @IsString()
  authorizedBy: string;
}
