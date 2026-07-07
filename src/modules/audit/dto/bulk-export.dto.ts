import { IsArray, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuditEventType } from '../entities/audit-event.enum';

export class BulkExportDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  logIds: string[];

  @ApiProperty({ example: 'pdf-a', required: false })
  @IsString()
  @IsOptional()
  format?: string;

  @ApiProperty({ enum: AuditEventType, required: false })
  @IsEnum(AuditEventType)
  @IsOptional()
  eventTypeFilter?: AuditEventType;
}
