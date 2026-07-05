import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from './identity-user.entity';

@Entity({ name: 'identity_passkeys' })
export class Passkey extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // ── WebAuthn credential fields ──
  @ApiProperty({ example: '<base64url credential id>' })
  @Index({ unique: true })
  @Column({ name: 'credential_id', type: 'bytea', unique: true })
  credentialId: Buffer;

  @ApiProperty({ example: '<binary public key>' })
  @Column({ name: 'public_key', type: 'bytea' })
  publicKey: Buffer;

  @ApiProperty({ example: 0 })
  @Column({ name: 'sign_count', type: 'bigint', default: 0 })
  signCount: number;

  @ApiProperty({ example: 'platform' })
  @Column({ name: 'device_type', type: 'varchar', length: 50, nullable: true })
  deviceType: string | null;

  @ApiProperty({ example: ['internal', 'hybrid'] })
  @Column({
    name: 'transports',
    type: 'text',
    array: true,
    default: '{}',
  })
  transports: string[];

  @ApiPropertyOptional({ example: 'MacBook Pro TouchID' })
  @Column({ name: 'nickname', type: 'varchar', length: 100, nullable: true })
  nickname: string | null;

  @ApiPropertyOptional({ example: '2026-07-04T10:00:00Z' })
  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  // ── Relation ──
  @ApiProperty({ type: () => IdentityUser })
  @ManyToOne(() => IdentityUser, (user) => user.passkeys, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;
}
