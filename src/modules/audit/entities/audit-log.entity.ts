import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { AuditEventType } from './audit-event.enum';
import { AuditSeverity } from './audit-severity.enum';

@Entity({ name: 'audit_logs' })
export class AuditLog extends BaseEntity {
  @ApiProperty({ type: String, description: 'User UUID who triggered the event' })
  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ApiProperty({ enum: AuditEventType, example: AuditEventType.USER_LOGIN })
  @Index()
  @Column({ name: 'event_type', type: 'enum', enum: AuditEventType })
  eventType: AuditEventType;

  @ApiProperty({ enum: AuditSeverity, example: AuditSeverity.INFO })
  @Column({ name: 'severity', type: 'enum', enum: AuditSeverity, default: AuditSeverity.INFO })
  severity: AuditSeverity;

  @ApiProperty({ example: 'User logged in successfully' })
  @Column({ name: 'description', type: 'varchar', length: 500 })
  description: string;

  @ApiProperty({ example: '192.168.1.1' })
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @ApiProperty({ example: 'Mozilla/5.0...', description: 'User-Agent header' })
  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @ApiProperty({ example: '{"amount": 5000, "accountId": "..."}', description: 'Additional context as JSON' })
  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ example: 'POST', description: 'HTTP method' })
  @Column({ name: 'http_method', type: 'varchar', length: 10, nullable: true })
  httpMethod: string | null;

  @ApiProperty({ example: '/api/auth/login' })
  @Column({ name: 'http_path', type: 'varchar', length: 255, nullable: true })
  httpPath: string | null;

  @ApiProperty({ example: 200 })
  @Column({ name: 'http_status', type: 'int', nullable: true })
  httpStatus: number | null;
}
