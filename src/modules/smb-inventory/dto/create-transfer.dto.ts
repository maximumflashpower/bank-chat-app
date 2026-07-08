import {
  IsUUID,
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsUUID()
  @IsNotEmpty()
  fromWarehouseId: string;

  @IsUUID()
  @IsNotEmpty()
  toWarehouseId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  lotNumber?: string;
}
