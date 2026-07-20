import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum WalletProvider {
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  SAMSUNG_PAY = 'samsung_pay',
}

export enum NetworkTokenStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Entity('digital_wallet_token')
@Index(['customerId'])
@Index(['cardInstanceId'])
export class DigitalWalletToken extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'uuid', name: 'card_instance_id' })
  @Index()
  cardInstanceId: string;

  @Column({ type: 'varchar', length: 20 })
  walletProvider: WalletProvider;

  @Column({ type: 'varchar', length: 20, name: 'device_pan' })
  devicePan: string;

  @Column({ type: 'varchar', length: 4, name: 'dpn_last_four' })
  dpnLastFour: string;

  @Column({ type: 'varchar', length: 255, name: 'device_identifier' })
  deviceIdentifier: string;

  @Column({ type: 'varchar', length: 50, name: 'token_requestor_id' })
  tokenRequestorId: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'token_authorization_code' })
  tokenAuthorizationCode?: string;

  @Column({ type: 'varchar', length: 20, name: 'cryptogram_type' })
  cryptogramType: string;

  @Column({ type: 'varchar', length: 20, name: 'network_token_status' })
  networkTokenStatus: NetworkTokenStatus;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'spending_limit_amount' })
  spendingLimitAmount?: number;

  @Column({ type: 'simple-array', nullable: true, name: 'allowed_mcc_list' })
  allowedMccList?: string[];

  @Column({ type: 'simple-array', nullable: true, name: 'allowed_country_codes' })
  allowedCountryCodes?: string[];

  @Column({ type: 'timestamptz', nullable: true, name: 'expiry_datetime' })
  expiryDatetime?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_transaction_at' })
  lastTransactionAt?: Date;

  @Column({ type: 'boolean', default: false, name: 'created_by_api' })
  createdByApi: boolean;

  @Column({ type: 'timestamptz', name: 'provisioned_at' })
  provisionedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revokedAt?: Date;
}
