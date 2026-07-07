import { IsUUID, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClosePeriodDto {
  @ApiProperty()
  @IsUUID()
  period_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  permanent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  justification?: string;
}
