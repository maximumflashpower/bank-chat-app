import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { CredentialType } from './credential-type.enum';
import { IdentityUser } from './identity-user.entity';

@Entity({ name: 'credentials' })
export class Credential extends BaseEntity {
  @ApiProperty({ type: String, description: 'UUID of the owner user' })
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: CredentialType, example: CredentialType.PASSWORD })
  @Column({ name: 'type', type: 'enum', enum: CredentialType })
  type: CredentialType;

  @ApiProperty({ description: 'Hashed credential value (bcrypt)' })
  @Column({ name: 'hashed_value', type: 'varchar', length: 255 })
  hashedValue: string;

  @ApiProperty({ example: false })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ example: null })
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ example: 0 })
  @Column({ name: 'failed_attempts', type: 'int', default: 0 })
  failedAttempts: number;

  @ApiProperty({ example: null })
  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @ManyToOne(() => IdentityUser, (user) => user.credentials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;
}
