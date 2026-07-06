import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChangeStatus } from '../entities/change-status.enum';

export class ReviewChangeDto {
  @ApiProperty({ enum: ChangeStatus, description: 'Decisión: approved o rejected' })
  @IsEnum(ChangeStatus)
  status: ChangeStatus;

  @ApiProperty({ description: 'Comentario del CAB', required: false })
  @IsOptional()
  @IsString()
  reviewComment?: string;
}
