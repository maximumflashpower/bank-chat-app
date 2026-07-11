import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { BudgetHeader } from './budget-header.entity';

@Entity('smb_budget_line_item')
export class BudgetLineItem extends BaseEntity {
  @ManyToOne(() => BudgetHeader, header => header.lineItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_header_id' })
  budgetHeader: BudgetHeader;

  @Column({ type: 'uuid', nullable: false })
  budgetHeaderId: string;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'varchar', length: 100 })
  accountCategory: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'numeric', precision: 19, scale: 4 })
  budgetedAmount: number;

  @Column({ type: 'numeric', precision: 19, scale: 4, default: 0 })
  actualAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  assumptions: Record<string, unknown>;
}
