import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum QueueChannelOrigin {
  PHONE = 'phone',
  CHAT = 'chat',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in_app',
  BRANCH = 'branch',
}

export enum QueueInteractionType {
  INQUIRY = 'inquiry',
  COMPLAINT = 'complaint',
  REQUEST = 'request',
  TRANSACTION = 'transaction',
  COMPLAINT_ESCALATION = 'complaint_escalation',
}

export enum QueuePriorityLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  VIP = 'vip',
  URGENT = 'urgent',
}

export enum QueueStatus {
  QUEUED = 'queued',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  ABANDONED = 'abandoned',
}

@Entity('crm_omnichannel_queue')
@Index(['customerId'])
@Index(['interactionId'])
export class CrmOmnichannelQueue extends BaseEntity {
  @Column({ type: 'uuid', name: 'interaction_id' })
  interactionId: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 30, name: 'channel_origin' })
  channelOrigin: QueueChannelOrigin;

  @Column({ type: 'varchar', length: 20, name: 'interaction_type' })
  interactionType: QueueInteractionType;

  @Column({ type: 'varchar', length: 20, default: 'normal', name: 'priority_level' })
  priorityLevel: QueuePriorityLevel;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'skill_required' })
  skillRequired?: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'language_required' })
  languageRequired?: string;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_agent_id' })
  assignedAgentId?: string;

  @Column({ type: 'int', nullable: true, name: 'queue_position' })
  queuePosition?: number;

  @Column({ type: 'int', nullable: true, name: 'wait_time_seconds' })
  waitTimeSeconds?: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'sla_deadline' })
  slaDeadline?: Date;

  @Column({ type: 'boolean', default: false, name: 'sla_breached' })
  slaBreached: boolean;

  @Column({ type: 'boolean', default: false, name: 'escalated_to_supervisor' })
  escalatedToSupervisor: boolean;

  @Column({ type: 'varchar', length: 20, default: 'queued' })
  status: QueueStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'resolved_at' })
  resolvedAt?: Date;

  @Column({ type: 'int', nullable: true, name: 'resolution_time_seconds' })
  resolutionTimeSeconds?: number;
}
