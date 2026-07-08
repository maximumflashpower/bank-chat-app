import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { RegCompType } from './reg-comp-type.enum';

@Entity({ name: 'gov_reg_comp' })
export class GovRegComp extends BaseEntity {
  @Index()
  @Column({ type: 'enum', enum: RegCompType })
  type: RegCompType;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true })
  relatedPolicyId?: string;

  @Column({ type: 'uuid', nullable: true })
  relatedFrameworkId?: string;

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, any>;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @Column({ type: 'date', nullable: true })
  scheduledFor?: string;

  @Column({ type: 'date', nullable: true })
  completedAt?: string;

  @Column({ type: 'uuid', nullable: true })
  assignedToUserId?: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  score?: number;

  @Column({ type: 'text', nullable: true })
  findings?: string;

  @Column({ type: 'boolean', default: false })
  isAttested: boolean;
}
