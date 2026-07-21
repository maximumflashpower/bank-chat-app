import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum VaultMovementType {
  CASH_IN = 'cash_in',
  CASH_OUT = 'cash_out',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  ADJUSTMENT = 'adjustment',
  NIGHT_DEPOSIT = 'night_deposit',
  ATM_RESTOCK = 'atm_restock',
}

export enum VaultMovementStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REVERSED = 'reversed',
  CANCELLED = 'cancelled',
}

@Entity('teller_vault_movement')
@Index(['movementNumber'])
@Index(['vaultId'])
@Index(['sourceBranchId'])
@Index(['destinationBranchId'])
export class TellerVaultMovement extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'movement_number' })
  movementNumber: string;

  @Column({ type: 'uuid', name: 'vault_id' })
  vaultId: string;

  @Column({ type: 'varchar', length: 30, name: 'movement_type' })
  movementType: VaultMovementType;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'amount_total' })
  amountTotal: number;

  @Column({ type: 'jsonb', nullable: true, name: 'denomination_breakdown' })
  denominationBreakdown?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 3, default: 'USD', name: 'currency_code' })
  currencyCode: string;

  @Column({ type: 'uuid', nullable: true, name: 'source_branch_id' })
  sourceBranchId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'destination_branch_id' })
  destinationBranchId?: string;

  @Column({ type: 'uuid', name: 'requested_by_user_id' })
  requestedByUserId: string;

  @Column({ type: 'uuid', nullable: true, name: 'authorized_by_user_id' })
  authorizedByUserId?: string;

  @Column({ type: 'boolean', default: false, name: 'dual_control_approved' })
  dualControlApproved: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'dual_control_witness_id' })
  dualControlWitnessId?: string;

  @Column({ type: 'text', nullable: true, name: 'authorization_notes' })
  authorizationNotes?: string;

  @Column({ type: 'text', nullable: true, name: 'purpose_description' })
  purposeDescription?: string;

  @Column({ type: 'varchar', length: 20, default: VaultMovementStatus.PENDING, name: 'movement_status' })
  movementStatus: VaultMovementStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'executed_at' })
  executedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'reversed_at' })
  reversedAt?: Date;

  @Column({ type: 'uuid', nullable: true, name: 'reversal_reason_id' })
  reversalReasonId?: string;
}
