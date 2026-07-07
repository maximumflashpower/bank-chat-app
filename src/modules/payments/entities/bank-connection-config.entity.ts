import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('bank_connection_config')
export class BankConnectionConfig extends BaseEntity {
  @Column({ type: 'varchar', length: 200, nullable: false })
  bankName: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  connectionProtocol: string;

  @Column({ type: 'text', nullable: true })
  apiEndpointUrl?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  authenticationType?: string;

  @Column({ type: 'text', nullable: true })
  certificateChainEncrypted?: string;

  @Column({ type: 'text', nullable: true })
  credentialsEncrypted?: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'DISCONNECTED' })
  connectionStatus: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastSuccessfulPoll?: Date;

  @Column({ type: 'int', nullable: false, default: 15 })
  pollFrequencyMinutes: number;

  @Column({ type: 'text', array: true, nullable: true })
  supportedCurrencies?: string[];

  @Column({ type: 'boolean', nullable: false, default: true })
  supportsPaymentsOutbound: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  supportsInboundNotifications: boolean;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  dailyVolumeLimit?: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  remainingDailyVolume?: number;

  @Column({ type: 'boolean', nullable: false, default: true })
  failoverEnabled: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  configuredAt?: Date;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'createdBy' })
  createdByUser?: IdentityUser;
}
