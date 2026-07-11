import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloneBudgetDto {
  @ApiProperty({ example: 'uuid-here', description: 'Original budget to clone from' })
  @IsString()
  sourceBudgetId: string;

  @ApiProperty({ example: 'Budget FY2027' })
  @IsString()
  newBudgetName: string;

  @ApiProperty({ example: 2027 })
  @IsInt()
  @Min(2020)
  fiscalYear: number;

  @ApiPropertyOptional({ example: 'Copy all line items with 5% increase' })
  @IsString()
  @IsOptional()
  adjustments?: string;

  @ApiPropertyOptional({ example: 0.05, description: '5% year-over-year increase' })
  @IsString()
  @IsOptional()
  percentageIncrease?: string;
}
