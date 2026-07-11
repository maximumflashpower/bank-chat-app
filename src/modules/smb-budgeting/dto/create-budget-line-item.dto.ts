import { IsString, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBudgetLineItemDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsString()
  budgetHeaderId: string;

  @ApiProperty({ example: 1, description: 'Month 1-12' })
  @IsInt()
  @Min(1)
  month: number;

  @ApiProperty({ example: 'Office Supplies' })
  @IsString()
  accountCategory: string;

  @ApiProperty({ example: 'Monthly office supplies budget' })
  @IsString()
  description: string;

  @ApiProperty({ example: 5000.00 })
  @IsNumber()
  budgetedAmount: number;

  @ApiPropertyOptional({ example: 4500.00, default: 0 })
  @IsNumber()
  @IsOptional()
  actualAmount?: number;

  @ApiPropertyOptional({})
  @IsOptional()
  assumptions?: Record<string, unknown>;
}
