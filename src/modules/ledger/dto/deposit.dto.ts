import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class DepositDto {
  @ApiProperty({ example: '1000.00' })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({ example: 'Cash deposit', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
