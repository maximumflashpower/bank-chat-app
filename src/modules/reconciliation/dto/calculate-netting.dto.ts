import { IsString, IsEnum, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { NettingType } from '../entities/netting-type.enum';

export class NettingParticipant {
  @IsString()
  participantId: string;

  @IsString()
  accountRef: string;

  @IsString()
  amount: string;
}

export class CalculateNettingDto {
  @ApiProperty({ enum: NettingType })
  @IsEnum(NettingType)
  nettingType: NettingType;

  @ApiProperty({ example: '2026-07-31' })
  @IsDateString()
  periodDate: string;

  @ApiProperty({ type: [NettingParticipant] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NettingParticipant)
  participants: NettingParticipant[];
}
