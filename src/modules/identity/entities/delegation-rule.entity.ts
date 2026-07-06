import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { DelegationStatus } from './delegation-status.enum';

@Entity({ name: 'gov_delegation_rule' })
export class DelegationRule extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Column({ name: 'requester_id', type: 'uuid' })
  requesterId: string;

  @ApiProperty({ type: () => String })
  @Column({ name: 'approver_id', type: 'uuid' })
  approverId: string;

  @ApiProperty({ example: 'admin_permission_grant' })
  @Column({ name: 'action_type', type: 'varchar', length: 100 })
  actionType: string;

  @ApiProperty({ example: 'Temporary admin access for emergency maintenance' })
  @Column({ name: 'justification', type: 'text' })
  justification: string;

  @ApiProperty({ enum: DelegationStatus, default: DelegationStatus.PENDING })
  @Column({ name: 'status', type: 'varchar', length: 20, default: DelegationStatus.PENDING })
  status: DelegationStatus;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @ApiProperty({ type: () => Date, nullable: true })
  @Column({ name: 'expired_at', type: 'timestamptz', nullable: true })
  expiredAt: Date | null;

  @ApiProperty({ type: () => [String] })
  @Column({ name: 'delegatee_override_ids', type: 'uuid', array: true, default: '{}' })
  delegateeOverrideIds: string[];

  @ApiProperty({ type: () => [String] })
  @Column({ name: 'escalation_path', type: 'uuid', array: true, default: '{}' })
  escalationPath: string[];
}
