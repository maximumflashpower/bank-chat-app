import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { DeviceTrustLevel } from './device-trust-level.enum';

@Entity({ name: 'gov_device_trust' })
export class DeviceTrust extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'laptop-chrome-win11' })
  @Column({ name: 'device_id', type: 'varchar', length: 255 })
  deviceId: string;

  @ApiProperty({ enum: DeviceTrustLevel, default: DeviceTrustLevel.TRUSTED })
  @Column({ name: 'trust_level', type: 'varchar', length: 20, default: DeviceTrustLevel.TRUSTED })
  trustLevel: DeviceTrustLevel;

  @ApiProperty({ example: 'Windows Hello + YubiKey' })
  @Column({ name: 'device_fingerprint', type: 'text', nullable: true })
  deviceFingerprint: string | null;

  @ApiProperty({ example: 100 })
  @Column({ name: 'reputation_score', type: 'numeric', precision: 5, scale: 2, default: 100 })
  reputationScore: number;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'first_seen', type: 'timestamptz', default: () => 'NOW()' })
  firstSeen: Date;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'last_activity', type: 'timestamptz', nullable: true })
  lastActivity: Date | null;

  @ApiProperty({ example: 'workstation-corporate' })
  @Column({ name: 'device_type_label', type: 'varchar', length: 50, nullable: true })
  deviceTypeLabel: string | null;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @ApiProperty({ example: 'Lost laptop' })
  @Column({ name: 'revocation_reason', type: 'text', nullable: true })
  revocationReason: string | null;
}
