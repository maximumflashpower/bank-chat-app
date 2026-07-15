import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

export enum ConsentPurpose {
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  THIRD_PARTY = 'third_party',
  ESSENTIAL = 'essential',
}

export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGITIMATE_INTEREST = 'legitimate_interest',
  LEGAL_OBLIGATION = 'legal_obligation',
}

@Entity('privacy_consent')
export class PrivacyConsent extends BaseEntity {
  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  purpose: ConsentPurpose;

  @Column({ type: 'varchar', length: 50, nullable: false })
  legalBasis: LegalBasis;

  @Column({ type: 'boolean', default: false })
  granted: boolean;

  @Column({ name: 'granted_at', type: 'timestamptz', nullable: true })
  grantedAt: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  granularity: Record<string, boolean> | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  version: string | null;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;
}
