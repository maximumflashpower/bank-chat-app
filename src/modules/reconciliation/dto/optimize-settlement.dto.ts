import { IsString, IsEnum, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OptimizationStrategy } from '../entities/optimization-strategy.enum';

export class SettlementPayment {
  @IsString()
  paymentId: string;

  @IsString()
  amount: string;

  @IsOptional()
  @IsString()
  bankRail?: string;

  @IsOptional()
  @IsString()
  priority?: string;
}

export class OptimizeSettlementDto {
  @ApiProperty({ enum: OptimizationStrategy })
  @IsEnum(OptimizationStrategy)
  optimizationStrategy: OptimizationStrategy;

  @ApiProperty({ example: 'SWIFT' })
  @IsString()
  bankChannel: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  currencyCode: string;

  @ApiPropertyOptional({ example: '14:30' })
  @IsString()
  @IsOptional()
  cutOffTime?: string;

  @ApiProperty({ type: [SettlementPayment] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettlementPayment)
  payments: SettlementPayment[];
}
