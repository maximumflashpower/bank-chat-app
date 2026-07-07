import { IsUUID, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReopenPeriodDto {
  @ApiProperty()
  @IsUUID()
  period_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  justification: string;
}
