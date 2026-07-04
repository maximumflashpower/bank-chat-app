import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: '000123456789', description: 'Destination account number' })
  @IsString()
  @IsNotEmpty()
  toAccountNumber: string;

  @ApiProperty({ example: '500.00' })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({ example: 'Payment for services', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
