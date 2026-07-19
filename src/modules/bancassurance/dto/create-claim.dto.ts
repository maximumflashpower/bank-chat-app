import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateClaimDto {
  @ApiProperty({ example: 'uuid-policy' })
  @IsString()
  @IsNotEmpty()
  policyId: string;

  @ApiProperty({ example: 'auto_accident' })
  @IsString()
  @IsNotEmpty()
  claimType: string;

  @ApiProperty({ example: '2026-01-15T10:00:00Z' })
  @IsDateString()
  incidentDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  incidentLocation?: string;

  @ApiProperty({ example: 'Colisión en intersección' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @IsNotEmpty()
  claimedAmount: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;
}
