import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OpportunityType {
  CROSS_SELL = 'cross_sell',
  UP_SELL = 'up_sell',
  RETENTION = 'retention',
  WINBACK = 'winback',
}

export enum OpportunityStage {
  IDENTIFIED = 'identified',
  QUALIFIED = 'qualified',
  PROPOSED = 'proposed',
  NEGOTIATING = 'negotiating',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

export class CreateOpportunityDto {
  @ApiProperty({ description: 'ID del cliente objetivo' })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Producto sugerido' })
  @IsNotEmpty()
  @IsString()
  productSuggested: string;

  @ApiProperty({ description: 'Tipo de oportunidad', enum: OpportunityType })
  @IsNotEmpty()
  @IsEnum(OpportunityType)
  opportunityType: OpportunityType;

  @ApiProperty({ description: 'Probabilidad de cierre (%)', required: false })
  @IsOptional()
  @IsNumber()
  probabilityWinPct?: number;

  @ApiProperty({ description: 'Valor estimado', required: false })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @ApiProperty({ description: 'Fecha estimada de cierre', required: false })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @ApiProperty({ description: 'Razonamiento NBA', required: false })
  @IsOptional()
  @IsString()
  nbaRecommendationReason?: string;
}
