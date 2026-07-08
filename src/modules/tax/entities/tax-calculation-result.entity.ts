import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Transaction } from '../../ledger/entities/transaction.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('tax_calculation_result')
export class TaxCalculationResult extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  transactionId?: string;

  @Column({ type: 'timestamptz', nullable: false, default: () => 'now()' })
  calculatedAt: Date;

  @Column({ type: 'varchar', length: 3, nullable: false, default: 'USD' })
  currency: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  taxableAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  taxAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  totalAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  calculationMethod: string;

  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: false })
  appliedRate: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  jurisdictionCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  productTaxCode?: string;

  @Column({ type: 'uuid', nullable: true })
  customerId?: string;

  @Column({ type: 'uuid', nullable: true })
  vendorId?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reasonExemption?: string;

  @Column({ type: 'jsonb', nullable: true })
  breakdownJson?: any;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  referenceDoc?: string;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transactionId' })
  transaction?: Transaction;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'createdBy' })
  createdByUser?: IdentityUser;
}
