import { IsString, IsEnum, IsBoolean, IsOptional, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AllocationDriver } from '../entities/allocation-driver.enum';
import { AllocationFrequency } from '../entities/allocation-frequency.enum';

export class CreateAllocationMethodDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsString()
  companyId: string;

  @ApiProperty({ example: 'Overhead by Sales Revenue' })
  @IsString()
  methodName: string;

  @ApiProperty({ example: 'Allocates administrative costs based on sales revenue per department' })
  @IsString()
  description: string;

  @ApiProperty({ enum: AllocationDriver })
  @IsEnum(AllocationDriver)
  driverType: AllocationDriver;

  @ApiProperty({ enum: AllocationFrequency, default: AllocationFrequency.MONTHLY })
  @IsEnum(AllocationFrequency)
  @IsOptional()
  frequency?: AllocationFrequency;

  @ApiPropertyOptional({})
  @IsObject()
  @IsOptional()
  driverSources?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 0.15, description: '15% fixed rate' })
  @IsNumber()
  @IsOptional()
  fixedRate?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
