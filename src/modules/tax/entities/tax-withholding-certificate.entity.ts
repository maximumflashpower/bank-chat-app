import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('tax_withholding_certificate')
export class TaxWithholdingCertificate extends BaseEntity {
  @Column({ type: 'varchar', length: 50, nullable: false })
  certificateNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  taxpayerRucNitId: string;

  @Column({ type: 'uuid', nullable: false })
  withholdeeId: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  withholdingType: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  grossAmount: number;

  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: false })
  withholdingRate: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  withholdingAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: false })
  netAmount: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoiceReference?: string;

  @Column({ type: 'date', nullable: true })
  servicePeriodStart?: Date;

  @Column({ type: 'date', nullable: true })
  servicePeriodEnd?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  certifiedAt?: Date;

  @Column({ type: 'text', nullable: true })
  pdfDocumentUrl?: string;

  @Column({ type: 'uuid', nullable: true })
  issuedBy?: string;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'withholdeeId' })
  withholdee?: IdentityUser;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'issuedBy' })
  issuedByUser?: IdentityUser;
}
