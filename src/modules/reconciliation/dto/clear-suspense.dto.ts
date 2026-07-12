import { IsUUID, IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClearSuspenseDto {
  @ApiProperty()
  @IsUUID()
  suspenseAccountId: string;

  @ApiProperty()
  @IsUUID()
  targetAccountId: string;

  @ApiProperty({ example: '1500.00' })
  @IsString()
  amount: string;

  @ApiProperty({ example: 'Clearing suspense entry for batch XYZ' })
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  batchId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reference?: string;
}
