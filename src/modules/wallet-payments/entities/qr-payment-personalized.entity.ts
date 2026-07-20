import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity.js';

export enum QrStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  REUSED = 'reused',
}

@Entity('qr_payment_personalized')
@Index(['ownerUserId'])
export class QrPaymentPersonalized extends BaseEntity {
  @Column({ type: 'uuid', name: 'owner_user_id' })
  ownerUserId: string;

  @Column({ type: 'varchar', length: 500, name: 'encoded_vasta_token' })
  encodedVastaToken: string;

  @Column({ type: 'text', nullable: true, name: 'display_image_url_svg' })
  displayImageUrlSvg?: string;

  @Column({ type: 'uuid', name: 'linked_account_id' })
  linkedAccountId: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'fixed_amount_optional' })
  fixedAmountOptional?: number;

  @Column({ type: 'jsonb', nullable: true, name: 'merchant_info_json' })
  merchantInfoJson?: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true, name: 'validity_start_time' })
  validityStartTime?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'validity_end_time' })
  validityEndTime?: Date;

  @Column({ type: 'int', default: 0, name: 'scan_count_total' })
  scanCountTotal: number;

  @Column({ type: 'int', default: 0, name: 'successful_scans' })
  successfulScans: number;

  @Column({ type: 'int', default: 0, name: 'failed_scans' })
  failedScans: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_scanned_at' })
  lastScannedAt?: Date;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: QrStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revokedAt?: Date;
}
