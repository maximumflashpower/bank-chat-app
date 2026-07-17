import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional,
  IsString, IsDateString, IsInt, Min,
} from 'class-validator';
import { AccrualType } from '../entities/ledger-accrual.entity';

export class CreateAccrualDto {
  @ApiProperty({ example: 'ACC-2026-001' })
  @IsString()
  @IsNotEmpty()
  accrualCode: string;

  @ApiProperty({ example: 'Prepago de seguro anual' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: AccrualType })
  @IsEnum(AccrualType)
  accrualType: AccrualType;

  @ApiProperty({ example: 12000 })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 12, description: 'Número total de periodos' })
  @IsInt()
  @Min(1)
  periodsTotal: number;

  @ApiProperty({ example: 'monthly', default: 'monthly' })
  @IsOptional()
  @IsString()
  periodicity?: string;

  @ApiProperty({ description: 'UUID de cuenta débito' })
  @IsString()
  @IsNotEmpty()
  debitAccountId: string;

  @ApiProperty({ description: 'UUID de cuenta crédito' })
  @IsString()
  @IsNotEmpty()
  creditAccountId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  segmentBranchId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  segmentDeptId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  segmentProjectId?: string;

  @ApiProperty({ description: 'UUID del usuario creador' })
  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
