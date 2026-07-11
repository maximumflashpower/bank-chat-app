import { IsString, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogTimeDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsString()
  projectId: string;

  @ApiProperty({ example: 'uuid-here' })
  @IsString()
  userId: string;

  @ApiProperty({ example: '2026-07-10' })
  @IsDateString()
  entryDate: string;

  @ApiProperty({ example: 8.5, description: 'Hours worked' })
  @IsNumber()
  @Min(0)
  hoursLogged: number;

  @ApiPropertyOptional({ example: 'Frontend development' })
  @IsString()
  @IsOptional()
  taskDescription?: string;

  @ApiPropertyOptional({ example: 75.00 })
  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @ApiPropertyOptional({ example: true, description: 'Is billable to client' })
  @IsString()
  @IsOptional()
  billable?: boolean;
}
