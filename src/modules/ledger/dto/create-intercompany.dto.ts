import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional,
  IsString, IsDateString,
} from 'class-validator';
import { IntercompanyTxnType } from '../entities/ledger-intercompany.entity';

export class CreateIntercompanyDto {
  @ApiProperty({ example: 'IC-2026-001' })
  @IsString()
  @IsNotEmpty()
  txnCode: string;

  @ApiProperty({ enum: IntercompanyTxnType })
  @IsEnum(IntercompanyTxnType)
  txnType: IntercompanyTxnType;

  @ApiProperty({ example: 'Préstamo intercompany sucursal MX' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'UUID entidad origen' })
  @IsString()
  @IsNotEmpty()
  fromEntityId: string;

  @ApiProperty({ description: 'UUID entidad destino' })
  @IsString()
  @IsNotEmpty()
  toEntityId: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: '2026-07-17' })
  @IsDateString()
  txnDate: string;

  @ApiProperty({ required: false, example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false, description: 'Método de precio de transferencia' })
  @IsOptional()
  @IsString()
  transferPriceMethod?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  costCenterFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  costCenterTo?: string;

  @ApiProperty({ required: false, description: 'Base de asignación' })
  @IsOptional()
  @IsString()
  allocationBasis?: string;

  @ApiProperty({ description: 'UUID del usuario creador' })
  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
