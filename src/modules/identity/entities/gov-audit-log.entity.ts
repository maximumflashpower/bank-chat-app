import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';

@Entity({ name: 'gov_audit_log' })
export class GovAuditLog extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Column({ name: 'actor_id', type: 'uuid' })
  actorId: string;

  @ApiProperty({ example: 'DELEGATION_APPROVED' })
  @Column({ name: 'action_type', type: 'varchar', length: 100 })
  actionType: string;

  @ApiProperty({ type: () => String })
  @Column({ name: 'target_entity_id', type: 'uuid', nullable: true })
  targetEntityId: string | null;

  @ApiProperty({ example: 'delegation_rule' })
  @Column({ name: 'target_entity_type', type: 'varchar', length: 50, nullable: true })
  targetEntityType: string | null;

  @ApiProperty({ type: () => Object })
  @Column({ name: 'details', type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  @ApiProperty({ example: '192.168.1.100' })
  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ example: 'Mozilla/5.0...' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'acted_at', type: 'timestamptz', default: () => 'NOW()' })
  actedAt: Date;

  @ApiProperty({ type: () => String })
  @Column({ name: 'compliance_tags', type: 'varchar', array: true, default: '{}' })
  complianceTags: string[];
}
