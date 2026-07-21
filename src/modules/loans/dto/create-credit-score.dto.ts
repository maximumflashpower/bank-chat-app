import { IsInt, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateCreditScoreDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Score del buró de crédito (300-850)' })
  @IsOptional()
  @IsInt()
  @Min(300)
  @Max(850)
  bureauScore?: number;

  @ApiPropertyOptional({ description: 'Ratio Debt-to-Income (%)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  dtiRatio?: number;

  @ApiPropertyOptional({ description: 'Ingreso anual' })
  @IsOptional()
  @IsInt()
  @Min(0)
  annualIncome?: number;

  @ApiPropertyOptional({ description: 'Años de empleo actual' })
  @IsOptional()
  @IsInt()
  @Min(0)
  employmentTenureYears?: number;

  @ApiPropertyOptional({ description: 'Utilización de crédito (%)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  creditUtilization?: number;

  @ApiPropertyOptional({ description: 'Historial de pagos a tiempo (%)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  paymentHistoryPercent?: number;

  @ApiPropertyOptional({ description: 'Número de inquiries recientes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfInquiries?: number;

  @ApiPropertyOptional({ description: 'Edad de cuenta más antigua (meses)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  accountAgeMonths?: number;

  @ApiPropertyOptional({ description: 'Monto del préstamo solicitado' })
  @IsOptional()
  @IsInt()
  @Min(0)
  loanAmountRequested?: number;
}
