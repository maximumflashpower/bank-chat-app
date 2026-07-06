import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from './identity-user.entity';

@Entity({ name: 'identity_sessions' })
export class IdentitySession extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ type: () => String })
  @Index({ unique: true })
  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 128, unique: true })
  refreshTokenHash: string;

  @ApiProperty({ example: 'a7f3b2c1d4e5f6a7b8c9' })
  @Column({ name: 'device_fingerprint', type: 'varchar', length: 255, nullable: true })
  deviceFingerprint: string | null;

  @ApiProperty({ example: 'Chrome on Windows 11' })
  @Column({ name: 'device_name', type: 'varchar', length: 255, nullable: true })
  deviceName: string | null;

  @ApiProperty({ example: '192.168.1.100' })
  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ example: 'Mozilla/5.0...' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'issued_at', type: 'timestamptz', default: () => 'NOW()' })
  issuedAt: Date;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @ApiProperty({ type: () => Date, nullable: true })
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @ApiProperty({ type: () => Date, nullable: true })
  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @ApiProperty({ type: () => Boolean, default: false })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => IdentityUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;
}
