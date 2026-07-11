import { IsString, IsInt, IsDateString, IsEnum, IsOptional, IsNumber, IsBoolean, IsObject, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetStatus } from '../entities/budget-status.enum';

export class CreateBudgetDto {
  @ApiProperty({ example: 'Budget FY2026' })
  @IsString()
  @MinLength(3)
  budgetName: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2020)
  fiscalYear: number;

  @ApiProperty({ example: 'uuid-here' })
  @IsString()
  companyId: string;

  @ApiProperty({ example: 'USD', default: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ enum: BudgetStatus, default: BudgetStatus.DRAFT })
  @IsEnum(BudgetStatus)
  @IsOptional()
  status?: BudgetStatus;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsNumber()
  @IsOptional()
  totalBudgetedAmount?: number;

  @ApiPropertyOptional({})
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({})
  @IsBoolean()
  @IsOptional()
  lockedAfterApproval?: boolean;

  @ApiPropertyOptional({})
  @IsString()
  @IsOptional()
  versionLabel?: string;

  @ApiPropertyOptional({})
  @IsString()
  @IsOptional()
  templateSourceId?: string;
}
