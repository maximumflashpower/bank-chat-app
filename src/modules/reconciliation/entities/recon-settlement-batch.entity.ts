import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { OptimizationStrategy } from './optimization-strategy.enum';
import { SettlementStatus } from './settlement-status.enum';

@Entity('recon_settlement_batch')
export class ReconSettlementBatch extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  settlementBatchNumber: string;

  @Column({ type: 'enum', enum: OptimizationStrategy })
  optimizationStrategy: OptimizationStrategy;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankChannel: string;

  @Column({ type: 'varchar', length: 3 })
  currencyCode: string;

  @Column({ type: 'int', default: 0 })
  totalPaymentsCount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalGrossAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalFeesEstimated: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalNetAmount: number;

  @Column({ type: 'int', default: 0 })
  priorityPaymentsCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  cutOffTimeUsed: Date;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  optimizationSavings: number;

  @Column({ type: 'enum', enum: SettlementStatus, default: SettlementStatus.OPTIMIZED })
  status: SettlementStatus;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  settledAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankReference: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;
}
