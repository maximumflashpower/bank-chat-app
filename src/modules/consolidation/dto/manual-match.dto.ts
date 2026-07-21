import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualMatchDto {
  @ApiProperty()
  @IsString()
  matchedEntryId: string;

  @ApiProperty()
  @IsNumber()
  eliminatedAmount: number;
}
