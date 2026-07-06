import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { RecoveryStatus } from './recovery-status.enum';

@Entity({ name: 'gov_recovery_ticket' })
export class RecoveryTicket extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'initiated_at', type: 'timestamptz', default: () => 'NOW()' })
  initiatedAt: Date;

  @ApiProperty({ example: 'email_backup' })
  @Column({ name: 'contact_method', type: 'varchar', length: 50 })
  contactMethod: string;

  @ApiProperty({ type: () => Object })
  @Column({ name: 'contact_addresses', type: 'jsonb', nullable: true })
  contactAddresses: Record<string, unknown> | null;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'verification_deadline', type: 'timestamptz', nullable: true })
  verificationDeadline: Date | null;

  @ApiProperty({ example: 0 })
  @Column({ name: 'verified_count', type: 'int', default: 0 })
  verifiedCount: number;

  @ApiProperty({ example: 3 })
  @Column({ name: 'required_verifications', type: 'int', default: 3 })
  requiredVerifications: number;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'cooldown_until', type: 'timestamptz', nullable: true })
  cooldownUntil: Date | null;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'finalized_at', type: 'timestamptz', nullable: true })
  finalizedAt: Date | null;

  @ApiProperty({ enum: RecoveryStatus, default: RecoveryStatus.INITIATED })
  @Column({ name: 'status', type: 'varchar', length: 20, default: RecoveryStatus.INITIATED })
  status: RecoveryStatus;
}
