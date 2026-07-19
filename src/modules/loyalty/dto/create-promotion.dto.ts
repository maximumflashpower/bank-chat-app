import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsNumber, IsArray, IsDateString, IsEnum } from 'class-validator';
import { PromotionType } from '../entities/loyalty-promotion.entity';

export class CreatePromotionDto {
  @ApiProperty({ example: 'uuid-program', description: 'ID del programa' })
  @IsUUID()
  @IsNotEmpty()
  programId: string;

  @ApiProperty({ example: 'MULTIPLIADOR-2X-DINING', description: 'Código promocional' })
  @IsString()
  @IsNotEmpty()
  promotionCode: string;

  @ApiProperty({ example: '2x Puntos en Restaurantes', description: 'Nombre campaña' })
  @IsString()
  @IsNotEmpty()
  promotionName: string;

  @ApiProperty({ enum: PromotionType, example: PromotionType.MULTIPLIER })
  @IsEnum(PromotionType)
  promotionType: PromotionType;

  @ApiProperty({ example: new Date().toISOString(), description: 'Fecha inicio' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), description: 'Fecha fin' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 2.0, description: 'Multiplicador aplicable' })
  @IsOptional()
  @IsNumber()
  multiplierValue?: number;

  @ApiProperty({ example: 500, description: 'Bono fijo en puntos' })
  @IsOptional()
  @IsNumber()
  fixedBonusPoints?: number;

  @ApiProperty({ example: ['dining', 'travel'], description: 'Categorías elegibles' })
  @IsOptional()
  @IsArray()
  eligibleCategories?: string[];

  @ApiProperty({ example: 50.0, description: 'Mínimo transacción para calificar' })
  @IsOptional()
  @IsNumber()
  minTransactionAmount?: number;

  @ApiProperty({ example: 10000, description: 'Máximo puntos por cliente' })
  @IsOptional()
  @IsNumber()
  maxBonusPerCustomer?: number;

  @ApiProperty({ example: 100000, description: 'Presupuesto total de puntos' })
  @IsOptional()
  @IsNumber()
  totalBudgetPoints?: number;

  @ApiProperty({ example: ['gold', 'platinum'], description: 'Tiers elegibles' })
  @IsOptional()
  @IsArray()
  eligibleTiers?: string[];

  @ApiProperty({ example: 'admin@bank.com', description: 'Usuario que crea promoción' })
  @IsString()
  createdBy: string;
}
