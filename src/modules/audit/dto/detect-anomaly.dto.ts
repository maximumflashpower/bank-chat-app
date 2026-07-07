import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DetectAnomalyDto {
  @ApiProperty({ example: 'audit-log-service' })
  @IsString()
  sourceComponent: string;

  @ApiProperty({ type: Object, required: false })
  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>;

  @ApiProperty({ example: 'suspicious_write_pattern', required: false })
  @IsString()
  @IsOptional()
  anomalyType?: string;
}
