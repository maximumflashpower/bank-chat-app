import { IsBoolean, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SecurityEventCategory } from '../entities/security-event-category.enum';

export class ClassifyEventDto {
  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  classifiedAsIncident: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  falsePositive?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remediationAction?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  assignedTo?: string;
}
