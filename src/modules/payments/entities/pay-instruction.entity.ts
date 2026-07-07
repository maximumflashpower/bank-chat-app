import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('pay_instruction')
export class PayInstruction extends BaseEntity {
  @Column({ type: 'varchar', length: 50, nullable: false })
  instructionNumber: string;

  @Column({ type: 'varchar', length: 30, nullable: false })
  paymentType: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'normal' })
  urgency: string;

  @Column({ type: 'uuid', nullable: false })
  sourceAccountId: string;

  @Column({ type: 'uuid', nullable: true })
  destinationBeneficiaryId?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  amountOriginal: number;

  @Column({ type: 'varchar', length: 3, nullable: false })
  currencyOriginal: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  fxAmountSettled?: number;

  @Column({ type: 'numeric', precision: 8, scale: 6, nullable: true })
  fxRateUsed?: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  chargeBearer?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  purposeCode?: string;

  @Column({ type: 'text', nullable: true })
  referencePayerNotes?: string;

  @Column({ type: 'text', nullable: true })
  paymentReasonDescription?: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'pending' })
  approvalStatus: string;

  @Column({ type: 'int', nullable: true })
  currentApproverLevel?: number;

  @Column({ type: 'int', nullable: true })
  totalApprovalLevels?: number;

  @Column({ type: 'uuid', nullable: true })
  authorizedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  authorizedAt?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  settlementMethod?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankingChannelReference?: string;

  @Column({ type: 'jsonb', nullable: true })
  statusHistory?: any;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'createdBy' })
  createdByUser?: IdentityUser;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'authorizedBy' })
  authorizedByUser?: IdentityUser;
}
