import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsObject, IsOptional, IsDateString } from 'class-validator';

export class IssuePolicyDto {
  @ApiProperty({ example: 'uuid-user' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiProperty({ example: 'plus' })
  @IsString()
  @IsNotEmpty()
  coverageLevel: string;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @IsNotEmpty()
  premiumAmount: number;

  @ApiProperty({ example: 'monthly' })
  @IsString()
  @IsNotEmpty()
  premiumFrequency: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  deductible?: number;

  @ApiProperty({ example: { liability: 100000, collision: 50000 } })
  @IsObject()
  @IsNotEmpty()
  coverageLimits: Record<string, any>;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @IsNotEmpty()
  termMonths: number;

  @ApiProperty({ example: 'automatic' })
  @IsString()
  renewalType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  underwriterId?: string;
}
