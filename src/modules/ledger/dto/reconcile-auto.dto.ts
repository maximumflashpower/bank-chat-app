import { IsUUID, IsDateString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReconcileAutoDto {
  @ApiProperty()
  @IsUUID()
  bank_account_id: string;

  @ApiProperty()
  @IsUUID()
  period_id: string;

  @ApiProperty()
  @IsDateString()
  statement_date: string;

  @ApiProperty()
  @IsNumber()
  statement_balance: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tolerance?: number;
}
