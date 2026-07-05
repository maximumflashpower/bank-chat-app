import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from './identity-user.entity';
import { MfaType } from './mfa-type.enum';

@Entity({ name: 'identity_mfa_factors' })
export class MfaFactor extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: MfaType, example: MfaType.TOTP })
  @Column({ name: 'type', type: 'enum', enum: MfaType })
  type: MfaType;

  @ApiPropertyOptional({ example: 'JBSWY3DPEHPK3PXP' })
  @Column({ name: 'secret_encrypted', type: 'text', nullable: true })
  secretEncrypted: string | null;

  @ApiProperty({ example: false })
  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @ApiPropertyOptional({ example: '2026-07-04T10:00:00Z' })
  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  // ── Backup codes (stored as bcrypt hashes, JSON array) ──
  @ApiPropertyOptional({ example: ['$2b$10$hash1...', '$2b$10$hash2...'] })
  @Column({
    name: 'backup_codes_hashed',
    type: 'jsonb',
    nullable: true,
  })
  backupCodesHashed: string[] | null;

  @ApiPropertyOptional({ example: 'Google Authenticator' })
  @Column({ name: 'label', type: 'varchar', length: 100, nullable: true })
  label: string | null;

  // ── Relation ──
  @ApiProperty({ type: () => IdentityUser })
  @ManyToOne(() => IdentityUser, (user) => user.mfaFactors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;
}
