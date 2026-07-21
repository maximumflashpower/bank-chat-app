import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { ProgramType, ProgramStatus } from '../entities/loyalty-program.entity';

export class CreateProgramDto {
  @ApiProperty({ example: 'LOYALTY-2026', description: 'Código único del programa' })
  @IsString()
  @IsNotEmpty()
  programCode: string;

  @ApiProperty({ example: 'Premios Lealtad Premium', description: 'Nombre del programa' })
  @IsString()
  @IsNotEmpty()
  programName: string;

  @ApiProperty({ enum: ProgramType, example: ProgramType.POINTS })
  @IsEnum(ProgramType)
  programType: ProgramType;

  @ApiProperty({ example: 'puntos', description: 'Nombre de la unidad monetaria' })
  @IsString()
  @IsNotEmpty()
  currencyUnitName: string;

  @ApiProperty({ example: 1.0, description: 'Tasa base de acumulación' })
  @IsNumber()
  baseEarningRate: number;

  @ApiProperty({ example: 24, description: 'Meses hasta vencimiento de puntos' })
  @IsOptional()
  @IsNumber()
  defaultPointsExpiryMonths?: number;

  @ApiProperty({ example: true, description: 'Habilitar tiers de recompensas' })
  @IsOptional()
  @IsBoolean()
  rewardTiersEnabled?: boolean;

  @ApiProperty({ example: 100, description: 'Mínimo para canjear' })
  @IsOptional()
  @IsNumber()
  minimumRedemptionThreshold?: number;
}
