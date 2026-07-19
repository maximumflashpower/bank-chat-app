import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum CommissionStatus {
  ACCRUED = 'accrued',
  PAID = 'paid',
  REVERSED = 'reversed',
  PENDING = 'pending',
}

@Entity('agent_commissions')
export class AgentCommission extends BaseEntity {
  @Column({ name: 'agent_id', type: 'uuid', nullable: false })
  agentId: string;

  @Column({ name: 'policy_id', type: 'uuid', nullable: false })
  policyId: string;

  @Column({ name: 'commission_pct', type: 'numeric', precision: 5, scale: 2, nullable: false })
  commissionPct: number;

  @Column({ name: 'commission_amount', type: 'numeric', precision: 18, scale: 2, nullable: false })
  commissionAmount: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, nullable: false })
  currency: string;

  @Column({ type: 'varchar', length: 20, default: CommissionStatus.ACCRUED })
  status: CommissionStatus;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;
}
