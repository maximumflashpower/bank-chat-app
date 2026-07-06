import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from './identity-user.entity';

@Entity({ name: 'gov_passkey_sync_metadata' })
export class PasskeySyncMetadata extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ type: () => String })
  @Column({ name: 'passkey_id', type: 'uuid' })
  passkeyId: string;

  @ApiProperty({ example: 'laptop-chrome-win11' })
  @Column({ name: 'device_id', type: 'varchar', length: 255 })
  deviceId: string;

  @ApiProperty({ type: () => Boolean, default: false })
  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'synced_at', type: 'timestamptz', default: () => 'NOW()' })
  syncedAt: Date;

  @ApiProperty({ type: () => Date, nullable: true })
  @Column({ name: 'last_used_remote', type: 'timestamptz', nullable: true })
  lastUsedRemote: Date | null;

  @ApiProperty({ type: () => String })
  @ManyToOne(() => IdentityUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;
}
