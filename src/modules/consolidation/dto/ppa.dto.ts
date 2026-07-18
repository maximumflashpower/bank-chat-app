import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchasePriceAllocationDto {
  @ApiProperty()
  @IsNumber()
  fairValueAssets: number;

  @ApiProperty()
  @IsNumber()
  fairValueLiabilities: number;
}

export class ImpairmentTestDto {
  @ApiProperty()
  @IsNumber()
  carryingValue: number;

  @ApiProperty()
  @IsNumber()
  recoverableAmount: number;
}
