import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { SmbCompanyProfile } from '../../smb/entities/smb-company-profile.entity';
import { BudgetLineItem } from './budget-line-item.entity';
import { BudgetStatus } from './budget-status.enum';

@Entity('smb_budget_header')
export class BudgetHeader extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  companyId: string;

  @ManyToOne(() => SmbCompanyProfile, { eager: false })
  companyProfile: SmbCompanyProfile;

  @Column({ type: 'varchar', length: 255 })
  companyName: string;

  @Column({ type: 'int' })
  fiscalYear: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: BudgetStatus,
    default: BudgetStatus.DRAFT
  })
  status: BudgetStatus;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'numeric', precision: 19, scale: 4, nullable: true })
  totalBudgetedAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @OneToMany(() => BudgetLineItem, line => line.budgetHeader)
  lineItems: BudgetLineItem[];

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  comments: string;
}
