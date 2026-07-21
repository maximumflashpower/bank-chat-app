import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EliminationType } from '../entities/consolidation-elimination-entry.entity';

export class CreateEliminationDto {
  @ApiProperty()
  @IsString()
  runId: string;

  @ApiProperty({ enum: EliminationType })
  @IsEnum(EliminationType)
  eliminationType: EliminationType;

  @ApiProperty()
  @IsString()
  fromEntityId: string;

  @ApiProperty()
  @IsString()
  toEntityId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accountFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accountTo?: string;

  @ApiProperty()
  @IsNumber()
  originalAmount: number;

  @ApiProperty()
  @IsString()
  originalCurrency: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceDocument?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
