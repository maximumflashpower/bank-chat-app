import { IsString, IsArray, IsOptional, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MatchingRuleConfig {
  @ApiProperty({ example: 'amount_tolerance' })
  @IsString()
  ruleName: string;

  @ApiProperty({ example: '0.01' })
  @IsString()
  toleranceThreshold: string;

  @ApiProperty({ example: 'ABSOLUTE' })
  @IsString()
  toleranceType: string;

  @ApiPropertyOptional({ example: ['reference', 'amount', 'date'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  matchFields?: string[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class ConfigureRulesDto {
  @ApiProperty({ example: 'inter_system_recon' })
  @IsString()
  reconciliationType: string;

  @ApiProperty({ type: [MatchingRuleConfig] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchingRuleConfig)
  rules: MatchingRuleConfig[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
