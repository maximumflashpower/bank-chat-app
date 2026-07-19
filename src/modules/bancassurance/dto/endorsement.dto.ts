import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class EndorsementDto {
  @ApiProperty({ example: 'coverage_change' })
  @IsString()
  @IsNotEmpty()
  endorsementType: string;

  @ApiProperty({ example: { coverageLevel: 'premium' } })
  @IsObject()
  @IsNotEmpty()
  changes: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  premiumAdjustment?: number;

  @ApiProperty({ example: '2026-02-01' })
  @IsDateString()
  effectiveDate: string;
}
