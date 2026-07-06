import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';

@Entity({ name: 'gov_session_audit_log' })
export class SessionAuditLog extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ type: () => String })
  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId: string | null;

  @ApiProperty({ example: 'LOGIN' })
  @Column({ name: 'action', type: 'varchar', length: 50 })
  action: string;

  @ApiProperty({ example: '192.168.1.100' })
  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ example: 'User initiated login' })
  @Column({ name: 'reason', type: 'text', nullable: true })
  reason: string | null;

  @ApiProperty({ type: () => String })
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'acted_at', type: 'timestamptz', default: () => 'NOW()' })
  actedAt: Date;
}
