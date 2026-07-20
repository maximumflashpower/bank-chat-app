import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

@Entity('payhub_business_rule')
@Index(['organizationId'])
export class PayhubBusinessRule extends BaseEntity {
  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'varchar', length: 255, name: 'rule_name_description' })
  ruleNameDescription: string;

  @Column({ type: 'jsonb', name: 'trigger_condition_expression' })
  triggerConditionExpression: Record<string, unknown>;

  @Column({ type: 'simple-array', nullable: true, name: 'approval_hierarchy_chain' })
  approvalHierarchyChain?: string[];

  @Column({ type: 'int', nullable: true, name: 'required_approval_levels' })
  requiredApprovalLevels?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'max_amount_without_override' })
  maxAmountWithoutOverride?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'auto_approve_below_amount' })
  autoApproveBelowAmount?: number;

  @Column({ type: 'simple-array', nullable: true, name: 'notification_channels_alert' })
  notificationChannelsAlert?: string[];

  @Column({ type: 'simple-array', nullable: true, name: 'applicable_channel_types' })
  applicableChannelTypes?: string[];

  @Column({ type: 'date', nullable: true, name: 'effective_start_date' })
  effectiveStartDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'effective_end_date' })
  effectiveEndDate?: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active_enabled' })
  isActiveEnabled: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'modified_by' })
  modifiedBy?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'modified_at' })
  modifiedAt?: Date;
}
