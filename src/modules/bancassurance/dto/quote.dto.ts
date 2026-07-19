import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsObject, IsOptional } from 'class-validator';

export class QuoteDto {
  @ApiProperty({ example: 'uuid-user' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ example: { age: 30, vehicleAge: 5, location: 'urban' } })
  @IsObject()
  @IsNotEmpty()
  riskData: Record<string, any>;

  @ApiProperty({ example: 'basic' })
  @IsString()
  @IsNotEmpty()
  coverageLevel: string;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  deductible?: number;
}
