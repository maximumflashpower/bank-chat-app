import { IsString, IsArray, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManualMatchDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsUUID()
  batchId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  sourceARefs: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  sourceBRefs: string[];

  @ApiPropertyOptional({ example: 'Manual override by finance team' })
  @IsString()
  @IsOptional()
  reasonCode?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  createCorrectionEntry?: boolean;
}
