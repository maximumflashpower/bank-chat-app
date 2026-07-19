import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum WalletProvider {
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  SAMSUNG_PAY = 'samsung_pay',
}

export enum TokenStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity('card_token')
export class CardToken extends BaseEntity {
  @Column({ name: 'card_id', type: 'uuid', nullable: false })
  cardId: string;

  @Column({ name: 'wallet_provider', type: 'varchar', length: 20, nullable: false })
  walletProvider: WalletProvider;

  @Column({ name: 'token_value', type: 'text', nullable: false })
  tokenValue: string;

  @Column({ name: 'token_expiration', type: 'timestamptz', nullable: false })
  tokenExpiration: Date;

  @Column({ name: 'device_id', type: 'varchar', length: 100, nullable: true })
  deviceId: string | null;

  @Column({ name: 'device_name', type: 'varchar', length: 100, nullable: true })
  deviceName: string | null;

  @Column({ name: 'status', type: 'varchar', length: 20, default: TokenStatus.ACTIVE })
  status: TokenStatus;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;
}
