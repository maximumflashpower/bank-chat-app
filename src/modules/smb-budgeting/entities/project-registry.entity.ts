import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { ProjectStatus } from './project-status.enum';
import { ProjectRisk } from './project-risk.enum';

@Entity('smb_project_registry')
export class ProjectRegistry extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  companyId: string;

  @Column({ type: 'varchar', length: 255 })
  projectName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.INITIATING
  })
  status: ProjectStatus;

  @Column({
    type: 'enum',
    enum: ProjectRisk,
    default: ProjectRisk.MEDIUM
  })
  riskLevel: ProjectRisk;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'numeric', precision: 19, scale: 4, nullable: true })
  budgetedAmount: number;

  @Column({ type: 'numeric', precision: 19, scale: 4, default: 0 })
  actualCost: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  profitabilityPercentage: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  projectManager: string;

  @Column({ type: 'jsonb', nullable: true })
  milestones: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  stakeholders: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string;
}
