import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditEventType } from '../entities/audit-event.enum';
import { AuditSeverity } from '../entities/audit-severity.enum';

export class QueryAuditDto {
  @ApiProperty({ enum: AuditEventType, required: false })
  @IsOptional()
  @IsEnum(AuditEventType)
  eventType?: AuditEventType;

  @ApiProperty({ enum: AuditSeverity, required: false })
  @IsOptional()
  @IsEnum(AuditSeverity)
  severity?: AuditSeverity;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
