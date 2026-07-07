import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity('ai_recurring_template')
export class AiRecurringTemplate extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  templateName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  frequency: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  frequencyInterval: number;

  @Column({ type: 'date', nullable: false })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'jsonb', nullable: false })
  entryLinesTemplate: any;

  @Column({ type: 'boolean', nullable: false, default: true })
  autoGenerate: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  skipWeekend: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  adjustFirstDay: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastGeneratedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  nextScheduledAt?: Date;

  @Column({ type: 'int', nullable: false, default: 0 })
  generatedCount: number;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @ManyToOne(() => IdentityUser)
  @JoinColumn({ name: 'createdBy' })
  createdByUser?: IdentityUser;
}
