import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('tax_declaration_period')
export class TaxDeclarationPeriod extends BaseEntity {
  @Column({ type: 'varchar', length: 50, nullable: false })
  declarationType: string;

  @Column({ type: 'int', nullable: false })
  fiscalYear: number;

  @Column({ type: 'int', nullable: false })
  periodNumber: number;

  @Column({ type: 'varchar', length: 2, nullable: false })
  countryCode: string;

  @Column({ type: 'date', nullable: false })
  startDate: Date;

  @Column({ type: 'date', nullable: false })
  endDate: Date;

  @Column({ type: 'date', nullable: false })
  filingDeadline: Date;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'pending' })
  status: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  taxableBase?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  outputTax?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  inputTax?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  withheldTax?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  payableAmount?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  refundAmount?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  filingReference?: string;

  @Column({ type: 'timestamptz', nullable: true })
  filedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  preparedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy?: string;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'preparedBy' })
  preparedByUser?: IdentityUser;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'reviewedBy' })
  reviewedByUser?: IdentityUser;
}
