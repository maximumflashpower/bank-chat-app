import {
  Entity, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

export enum DsarRequestType {
  ACCESS = 'access',
  ERASURE = 'erasure',
  PORTABILITY = 'portability',
  RECTIFICATION = 'rectification',
  OBJECTION = 'objection',
}

export enum DsarStatus {
  RECEIVED = 'received',
  PROCESSING = 'processing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CLOSED = 'closed',
  REJECTED = 'rejected',
}

export enum DsarChannel {
  WEB = 'web',
  EMAIL = 'email',
  API = 'api',
  IN_APP = 'in_app',
  LETTER = 'letter',
}

@Entity('privacy_dsar_request')
export class PrivacyDsarRequest extends BaseEntity {
  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ name: 'request_type', type: 'varchar', length: 30, nullable: false })
  requestType: DsarRequestType;

  @Column({ type: 'varchar', length: 20, default: 'received' })
  status: DsarStatus;

  @Column({ name: 'received_channel', type: 'varchar', length: 50, nullable: true })
  receivedChannel: DsarChannel | null;

  @Column({ type: 'timestamptz', nullable: false })
  deadline: Date;

  @Column({ name: 'data_package_url', type: 'text', nullable: true })
  dataPackageUrl: string;

  @Column({ name: 'data_package_size', type: 'bigint', nullable: true })
  dataPackageSize: number;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;
}
