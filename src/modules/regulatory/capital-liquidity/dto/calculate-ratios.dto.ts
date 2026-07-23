import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsDate, IsOptional, IsArray, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CapitalRatioType, LiquidityRatioType, BufferType, StressScenarioSeverity, Pillar3Frequency } from '../entities/capital-liquidity-status.enum';

export class BufferBreakdownDto {
  @ApiProperty({ description: 'Tipo de buffer', enum: BufferType })
  @IsEnum(BufferType)
  bufferType: BufferType;

  @ApiProperty({ description: 'Monto del buffer' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Requisito del buffer (%)' })
  @IsNumber()
  requirement: number;
}

export class CalculateCapitalRatioDto {
  @ApiProperty({ description: 'Tipo de ratio de capital', enum: CapitalRatioType })
  @IsEnum(CapitalRatioType)
  ratioType: CapitalRatioType;

  @ApiProperty({ description: 'Monto de capital' })
  @IsNumber()
  capitalAmount: number;

  @ApiProperty({ description: 'Activos ponderados por riesgo (RWA)' })
  @IsNumber()
  riskWeightedAssets: number;

  @ApiProperty({ description: 'Fecha de reporte' })
  @IsDate()
  @Type(() => Date)
  reportingDate: Date;

  @ApiProperty({ description: 'Desglose de buffers', required: false, type: [BufferBreakdownDto] })
  @IsOptional()
  @IsArray()
  @Type(() => BufferBreakdownDto)
  bufferBreakdown?: BufferBreakdownDto[];
}

export class CalculateLcrDto {
  @ApiProperty({ description: 'Monto total HQLA' })
  @IsNumber()
  hqlaAmount: number;

  @ApiProperty({ description: 'Flujos netos de salida a 30 días' })
  @IsNumber()
  totalNetCashOutflows30d: number;

  @ApiProperty({ description: 'Fecha de reporte' })
  @IsDate()
  @Type(() => Date)
  reportingDate: Date;
}

export class CalculateNsfrDto {
  @ApiProperty({ description: 'Funding estable disponible (ASF)' })
  @IsNumber()
  availableStableFunding: number;

  @ApiProperty({ description: 'Funding estable requerido (RSF)' })
  @IsNumber()
  requiredStableFunding: number;

  @ApiProperty({ description: 'Fecha de reporte' })
  @IsDate()
  @Type(() => Date)
  reportingDate: Date;
}

export class CalculateLeverageDto {
  @ApiProperty({ description: 'Capital Tier 1' })
  @IsNumber()
  tier1Capital: number;

  @ApiProperty({ description: 'Exposición total (incl. off-balance)' })
  @IsNumber()
  totalExposure: number;

  @ApiProperty({ description: 'Fecha de reporte' })
  @IsDate()
  @Type(() => Date)
  reportingDate: Date;
}

export class CalculateStressedLcrDto {
  @ApiProperty({ description: 'HQLA base' })
  @IsNumber()
  baseHqlaAmount: number;

  @ApiProperty({ description: 'Flujos netos base' })
  @IsNumber()
  baseNetOutflows: number;

  @ApiProperty({ description: 'Severidad del escenario', enum: StressScenarioSeverity })
  @IsEnum(StressScenarioSeverity)
  severity: StressScenarioSeverity;

  @ApiProperty({ description: 'Fecha de reporte' })
  @IsDate()
  @Type(() => Date)
  reportingDate: Date;
}

export class PerformIcaapDto {
  @ApiProperty({ description: 'Ratio CET1 actual' })
  @IsNumber()
  cet1Ratio: number;

  @ApiProperty({ description: 'Ratio Tier 1 actual' })
  @IsNumber()
  tier1Ratio: number;

  @ApiProperty({ description: 'Ratio de capital total actual' })
  @IsNumber()
  totalCapitalRatio: number;

  @ApiProperty({ description: 'Ratio de apalancamiento actual' })
  @IsNumber()
  leverageRatio: number;

  @ApiProperty({ description: 'Crecimiento proyectado de RWA (%)' })
  @IsNumber()
  projectedRwaGrowth: number;
}

export class GeneratePillar3Dto {
  @ApiProperty({ description: 'Fecha de reporte' })
  @IsDate()
  @Type(() => Date)
  reportingDate: Date;

  @ApiProperty({ description: 'Frecuencia de disclosure', enum: Pillar3Frequency })
  @IsEnum(Pillar3Frequency)
  frequency: Pillar3Frequency;
}

export class CalculateRwaDto {
  @ApiProperty({ description: 'Lista de exposiciones', type: 'array' })
  @IsArray()
  exposures: {
    exposureCategory: string;
    exposureAmount: number;
    riskWeight: number;
  }[];
}
