import {
  Entity, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

export enum ErasureStatus {
  REQUESTED = 'requested',
  VALIDATING = 'validating',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export enum ErasureRejectionReason {
  LEGAL_RETENTION = 'legal_retention',
  ONGOING_INVESTIGATION = 'ongoing_investigation',
  OTHER = 'other',
}

@Entity('privacy_erasure_request')
export class PrivacyErasureRequest extends BaseEntity {
  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'varchar', length: 20, default: 'requested' })
  status: ErasureStatus;

  @Column({ name: 'rejection_reason', type: 'varchar', length: 50, nullable: true })
  rejectionReason: ErasureRejectionReason;

  @Column({ name: 'retention_validated', type: 'boolean', default: false })
  retentionValidated: boolean;

  @Column({ name: 'cascade_completed', type: 'boolean', default: false })
  cascadeCompleted: boolean;

  @Column({ name: 'systems_notified', type: 'text', array: true, nullable: true })
  systemsNotified: string[];

  @Column({ name: 'user_notified', type: 'boolean', default: false })
  userNotified: boolean;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;
}
