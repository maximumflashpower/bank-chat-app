import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum MarginCallStatus {
  ISSUED = 'issued',
  ACKNOWLEDGED = 'acknowledged',
  COMPLIANT = 'compliant',
  EXECUTED = 'executed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum MarginCallAction {
  PROVIDE_ADDITIONAL_COLLATERAL = 'provide_additional_collateral',
  PARTIAL_REPAYMENT = 'partial_repayment',
  LIQUIDATE_COLLATERAL = 'liquidate_collateral',
}

@Entity('margin_calls')
@Index(['loanId'])
@Index(['collateralId'])
export class MarginCall extends BaseEntity {
  @Column({ type: 'uuid', name: 'loan_id' })
  loanId: string;

  @Column({ type: 'uuid', name: 'collateral_id' })
  collateralId: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'current_ltv' })
  currentLtv: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'threshold_ltv' })
  thresholdLtv: number;

  @Column({ type: 'varchar', length: 30, name: 'action_required' })
  actionRequired: MarginCallAction;

  @Column({ type: 'date', name: 'deadline' })
  deadline: Date;

  @Column({ type: 'varchar', length: 20, default: MarginCallStatus.ISSUED })
  status: MarginCallStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'resolved_at' })
  resolvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'collateral_value_at_trigger' })
  collateralValueAtTrigger?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'required_topup_amount' })
  requiredTopupAmount?: number;

  @Column({ type: 'uuid', nullable: true, name: 'issued_by' })
  issuedBy?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'acknowledged_at' })
  acknowledgedAt?: Date;
}
