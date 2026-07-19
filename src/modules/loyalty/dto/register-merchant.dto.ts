import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsNumber } from 'class-validator';
import { MerchantCategory } from '../entities/loyalty-merchant-partner.entity';

export class RegisterMerchantDto {
  @ApiProperty({ example: 'uuid-program', description: 'ID del programa' })
  @IsUUID()
  @IsNotEmpty()
  programId: string;

  @ApiProperty({ example: 'MERCH-001', description: 'Código comerciante' })
  @IsString()
  @IsNotEmpty()
  merchantCode: string;

  @ApiProperty({ example: 'Restaurante El Buen Sabor', description: 'Nombre comerciante' })
  @IsString()
  @IsNotEmpty()
  merchantName: string;

  @ApiProperty({ enum: MerchantCategory, example: MerchantCategory.DINING })
  @IsEnum(MerchantCategory)
  merchantCategory: MerchantCategory;

  @ApiProperty({ example: '0.05', description: 'Tasa de comisión (5%)' })
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @ApiProperty({ example: '2.0', description: 'Multiplicador de ganancias' })
  @IsOptional()
  @IsNumber()
  earningMultiplier?: number;

  @ApiProperty({ example: 'admin@bank.com', description: 'Usuario registra' })
  @IsString()
  registeredBy: string;
}
