import { IsNumber, IsString, IsNotEmpty, IsDate, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MarginCallAction } from '../entities/margin-call.entity';

export class TriggerMarginCallDto {
  @ApiProperty({ description: 'ID del préstamo' })
  @IsNotEmpty()
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'ID del colateral' })
  @IsNotEmpty()
  @IsString()
  collateralId: string;

  @ApiProperty({ description: 'LTV actual (%)' })
  @IsNumber()
  @Min(0)
  currentLtv: number;

  @ApiProperty({ description: 'Umbral LTV (%)' })
  @IsNumber()
  @Min(0)
  thresholdLtv: number;

  @ApiProperty({ description: 'Acción requerida', enum: MarginCallAction })
  @IsEnum(MarginCallAction)
  actionRequired: MarginCallAction;

  @ApiProperty({ description: 'Fecha límite para cumplir' })
  @IsDate()
  deadline: Date;

  @ApiProperty({ description: 'Monto de colateral adicional requerido' })
  @IsNumber()
  @Min(0)
  requiredAdditionalCollateral: number;
}

export class ResolveMarginCallDto {
  @ApiProperty({ description: 'Solución implementada' })
  @IsString()
  resolution: string;

  @ApiProperty({ description: 'Nuevo valor de colateral' })
  @IsNumber()
  @Min(0)
  newCollateralValue: number;
}
