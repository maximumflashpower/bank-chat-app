import { IsUUID, IsNumber, IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class GenerateInventoryJournalDto {
  @IsUUID()
  @IsNotEmpty()
  companyProfileId: string;

  @IsUUID()
  @IsNotEmpty()
  stockMovementId: string;

  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsUUID()
  @IsNotEmpty()
  warehouseId: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  movementType: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @IsNumber()
  @IsOptional()
  totalCost?: number;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsUUID()
  @IsNotEmpty()
  fiscalPeriodId: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  reference?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  createdBy?: string;
}
