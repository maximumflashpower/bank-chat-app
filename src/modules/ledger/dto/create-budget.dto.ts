import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional,
  IsString, IsInt, Min,
} from 'class-validator';
import { BudgetType } from '../entities/ledger-budget.entity';

export class CreateBudgetDto {
  @ApiProperty({ example: 'BUD-2026-OPS-001' })
  @IsString()
  @IsNotEmpty()
  budgetCode: string;

  @ApiProperty({ example: 'Presupuesto Operativo 2026' })
  @IsString()
  @IsNotEmpty()
  budgetName: string;

  @ApiProperty({ enum: BudgetType })
  @IsEnum(BudgetType)
  budgetType: BudgetType;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  fiscalYear: number;

  @ApiProperty({ description: 'UUID de la cuenta contable' })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  budgetedAmount: number;

  @ApiProperty({ required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

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
