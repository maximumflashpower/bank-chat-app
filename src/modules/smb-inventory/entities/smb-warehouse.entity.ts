import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { SmbCompanyProfile } from '../../smb/entities/smb-company-profile.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('smb_warehouse')
export class SmbWarehouse extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  companyProfileId: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  code: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

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

  @Column({ type: 'boolean', nullable: false, default: false })
  isPrimary: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  managerId?: string;

  @ManyToOne(() => SmbCompanyProfile)
  @JoinColumn({ name: 'companyProfileId' })
  companyProfile?: SmbCompanyProfile;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'managerId' })
  manager?: IdentityUser;
}
