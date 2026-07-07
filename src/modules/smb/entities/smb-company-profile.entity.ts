import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('smb_company_profile')
export class SmbCompanyProfile extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  legalBusinessName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tradeNameDbah?: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  taxIdentificationNumber: string;

  @Column({ type: 'varchar', length: 30, nullable: false })
  businessStructureType: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  industryCodeNaics?: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  fiscalYearStartMonth: number;

  @Column({ type: 'varchar', length: 3, nullable: false, default: 'USD' })
  baseCurrency: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  addressStreet?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressCity?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressStateProvince?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  addressPostalCode?: string;

  @Column({ type: 'varchar', length: 2, nullable: false })
  addressCountryCode: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPhoneMain?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmailPrimary?: string;

  @Column({ type: 'text', nullable: true })
  logoUploadUrl?: string;

  @Column({ type: 'text', nullable: true })
  websiteUrl?: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'FREE' })
  bankingTierPlan: string;

  @Column({ type: 'timestamptz', nullable: true })
  onboardCompletedAt?: Date;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'userId' })
  user?: IdentityUser;
}
