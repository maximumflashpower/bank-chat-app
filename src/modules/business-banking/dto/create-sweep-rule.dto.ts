import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { SweepType, SweepFrequency, SweepDirection } from '../entities/business-sweep-rule.entity';

export class CreateSweepRuleDto {
  @ApiProperty()
  @IsString()
  ruleName: string;

  @ApiProperty()
  @IsString()
  sourceAccountId: string;

  @ApiProperty()
  @IsString()
  concentrationAccountId: string;

  @ApiProperty({ enum: SweepType })
  @IsEnum(SweepType)
  sweepType: SweepType;

  @ApiProperty({ enum: SweepFrequency })
  @IsEnum(SweepFrequency)
  sweepFrequency: SweepFrequency;

  @ApiProperty({ example: '09:00' })
  @IsString()
  sweepExecutionTime: string;

  @ApiProperty({ enum: SweepDirection })
  @IsEnum(SweepDirection)
  direction: SweepDirection;
}
