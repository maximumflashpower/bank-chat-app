import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('reg_compliance_trainings')
export class ComplianceTraining extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'varchar', length: 100 })
  courseName: string;

  @Column({ type: 'varchar', length: 50 })
  courseCategory: string;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'assigned' })
  status: string;
}
