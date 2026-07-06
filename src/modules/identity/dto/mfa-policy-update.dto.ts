import { IsString, IsNumber, IsBoolean, IsOptional, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MfaPolicyUpdateDto {
  @ApiPropertyOptional({ example: 'risk-policy-v2' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 2.0 })
  @IsNumber()
  @Min(0)
  @Max(9.9)
  @IsOptional()
  riskThresholdLow?: number;

  @ApiPropertyOptional({ example: 5.0 })
  @IsNumber()
  @Min(0)
  @Max(9.9)
  @IsOptional()
  riskThresholdHigh?: number;

  @ApiPropertyOptional({ type: () => Boolean })
  @IsBoolean()
  @IsOptional()
  enforceNewDevice?: boolean;

  @ApiPropertyOptional({ type: () => Boolean })
  @IsBoolean()
  @IsOptional()
  enforceUnusualLocation?: boolean;

  @ApiPropertyOptional({ type: () => Boolean })
  @IsBoolean()
  @IsOptional()
  enforceAfterHourAccess?: boolean;

  @ApiPropertyOptional({ type: () => Boolean })
  @IsBoolean()
  @IsOptional()
  allowTrustedNetworkBypass?: boolean;

  @ApiPropertyOptional({ example: 8 })
  @IsNumber()
  @Min(1)
  @Max(168)
  @IsOptional()
  sessionDurationHours?: number;
}
