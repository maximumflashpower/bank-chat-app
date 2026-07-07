import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('cashflow_classification_log')
export class CashflowClassificationLog extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  transactionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankReferenceNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  counterpartyName?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  amountOriginal?: number;

  @Column({ type: 'varchar', length: 3, nullable: true })
  currencyOriginal?: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  classifiedCategory: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  mlPredictionConfidence?: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  classificationMethod?: string;

  @Column({ type: 'uuid', nullable: true })
  overriddenBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  overriddenAt?: Date;

  @Column({ type: 'varchar', length: 7, nullable: true })
  projectedPeriod?: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  learningFeedbackApplied: boolean;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'overriddenBy' })
  overriddenByUser?: IdentityUser;
}
