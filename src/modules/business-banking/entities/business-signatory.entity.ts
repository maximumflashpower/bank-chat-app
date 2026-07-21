import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum AuthorizationLevel {
  SOLE = 'sole',
  JOINT = 'joint',
  DUAL = 'dual',
  VIEW_ONLY = 'view_only',
}

export enum SignatoryStatus {
  ACTIVE = 'active',
  REMOVED = 'removed',
  PENDING_APPROVAL = 'pending_approval',
}

@Entity('business_signatory')
export class BusinessSignatory extends BaseEntity {
  @Column({ name: 'account_id', type: 'uuid', nullable: false })
  accountId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ name: 'role_title', type: 'varchar', length: 100, nullable: true })
  roleTitle: string | null;

  @Column({ name: 'authorization_level', type: 'varchar', length: 20, nullable: false })
  authorizationLevel: AuthorizationLevel;

  @Column({ name: 'individual_limit_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  individualLimitAmount: number | null;

  @Column({ name: 'requires_cosign_above', type: 'numeric', precision: 18, scale: 2, nullable: true })
  requiresCosignAbove: number | null;

  @Column({ name: 'can_initiate_wire', type: 'boolean', default: false })
  canInitiateWire: boolean;

  @Column({ name: 'can_initiate_ach', type: 'boolean', default: false })
  canInitiateAch: boolean;

  @Column({ name: 'can_approve_wire', type: 'boolean', default: false })
  canApproveWire: boolean;

  @Column({ name: 'can_approve_ach', type: 'boolean', default: false })
  canApproveAch: boolean;

  @Column({ name: 'can_manage_signatories', type: 'boolean', default: false })
  canManageSignatories: boolean;

  @Column({ name: 'can_view_statements', type: 'boolean', default: true })
  canViewStatements: boolean;

  @Column({ name: 'can_export_statements', type: 'boolean', default: false })
  canExportStatements: boolean;

  @Column({ name: 'added_by', type: 'uuid', nullable: true })
  addedBy: string | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'added_at', type: 'timestamptz', nullable: true })
  addedAt: Date | null;

  @Column({ name: 'removed_at', type: 'timestamptz', nullable: true })
  removedAt: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: SignatoryStatus;
}
