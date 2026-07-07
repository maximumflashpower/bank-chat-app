import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { SmbCompanyProfile } from './smb-company-profile.entity';

@Entity('smb_bank_account_linked')
export class SmbBankAccountLinked extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  companyProfileId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  institutionFinancialName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  accountTypeClassification?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  accountOwnershipIndicator?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  accountNumberMaskedDisplay?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  routingSortTransitNumber?: string;

  @Column({ type: 'varchar', length: 3, nullable: true })
  currencySupported?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  dailyTransactionVolumeCap?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  balanceRealtimeCurrentAvailable?: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  statementFrequency?: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'disconnected' })
  connectionStatus: string;

  @Column({ type: 'text', nullable: true })
  oauthRefreshTokenEncrypted?: string;

  @Column({ type: 'text', nullable: true })
  webhookNotificationEndpoint?: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastStatementImportTimestamp?: Date;

  @Column({ type: 'boolean', nullable: false, default: true })
  autoReconciliationEnabled: boolean;

  @Column({ type: 'int', nullable: false, default: 0 })
  importedTransactionsCount: number;

  @ManyToOne(() => SmbCompanyProfile)
  @JoinColumn({ name: 'companyProfileId' })
  companyProfile?: SmbCompanyProfile;
}
