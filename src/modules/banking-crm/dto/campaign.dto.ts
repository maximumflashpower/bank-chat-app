import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty({ description: 'Nombre de la campaña' })
  @IsNotEmpty()
  @IsString()
  campaignName: string;

  @ApiProperty({ description: 'Objetivo de la campaña', enum: ['cross_sell', 'up_sell', 'retention', 'reactivation', 'referral'] })
  @IsNotEmpty()
  @IsString()
  campaignObjective: string;

  @ApiPropertyOptional({ description: 'Lista de IDs de clientes objetivo' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCustomerIds?: string[];

  @ApiPropertyOptional({ description: 'Producto sugerido principal' })
  @IsOptional()
  @IsString()
  suggestedProduct?: string;

  @ApiPropertyOptional({ description: 'Fecha inicio' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CampaignMetricDto {
  @ApiProperty({ description: 'Total enviados' })
  @Min(0)
  @IsNumber()
  sent: number;

  @ApiProperty({ description: 'Total abiertos' })
  @Min(0)
  @IsNumber()
  opened: number;

  @ApiProperty({ description: 'Total convertidos' })
  @Min(0)
  @IsNumber()
  converted: number;
}
