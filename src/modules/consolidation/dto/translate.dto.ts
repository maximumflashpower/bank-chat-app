import { IsString, IsNumber, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TranslationMethod, TranslationType } from '../entities/consolidation-currency-translation.entity';

export class TranslateDto {
  @ApiProperty()
  @IsString()
  runId: string;

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiProperty({ enum: TranslationType })
  @IsEnum(TranslationType)
  translationType: TranslationType;

  @ApiProperty()
  @IsString()
  sourceCurrency: string;

  @ApiProperty()
  @IsString()
  targetCurrency: string;

  @ApiProperty({ enum: TranslationMethod })
  @IsEnum(TranslationMethod)
  translationMethod: TranslationMethod;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;
}

export class BulkTranslateDto {
  @ApiProperty()
  @IsString()
  runId: string;

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiProperty({ type: 'array' })
  @IsArray()
  entries: Array<{
    type: TranslationType;
    sourceCurrency: string;
    targetCurrency: string;
    method: TranslationMethod;
    amount: number;
    exchangeRate?: number;
  }>;
}
