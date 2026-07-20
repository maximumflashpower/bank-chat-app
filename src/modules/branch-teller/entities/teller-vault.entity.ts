import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

@Entity('teller_vault')
@Index(['branchId'])
export class TellerVault extends BaseEntity {
  @Column({ type: 'uuid', name: 'branch_id' })
  branchId: string;

  @Column({ type: 'varchar', length: 30, name: 'vault_identifier' })
  vaultIdentifier: string;

  @Column({ type: 'varchar', length: 20, name: 'vault_grade' })
  vaultGrade: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'current_balance_total' })
  currentBalanceTotal: number;

  @Column({ type: 'jsonb', nullable: true, name: 'denomination_breakdown' })
  denominationBreakdown?: Record<string, unknown>;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'minimum_cash_level' })
  minimumCashLevel?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'maximum_cash_limit' })
  maximumCashLimit?: number;

  @Column({ type: 'uuid', nullable: true, name: 'primary_custodian_id' })
  primaryCustodianId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'secondary_custodian_id' })
  secondaryCustodianId?: string;

  @Column({ type: 'boolean', default: false, name: 'dual_control_required' })
  dualControlRequired: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_locked' })
  isLocked: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_audit_at' })
  lastAuditAt?: Date;

  @Column({ type: 'uuid', nullable: true, name: 'last_audited_by' })
  lastAuditedBy?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_reconciliation_at' })
  lastReconciliationAt?: Date;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'variance_amount' })
  varianceAmount?: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;
}
