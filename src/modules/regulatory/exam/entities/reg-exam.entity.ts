import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';
import { IdentityUser } from '../../../identity/entities/identity-user.entity';

@Entity('reg_exams')
export class RegExam extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 100 })
  examinerAgency: string;

  @Column({ type: 'varchar', length: 50 })
  examType: string;

  @Column({ type: 'text' })
  scope: string;

  @Column({ type: 'date' })
  receivedDate: Date;

  @Column({ type: 'date' })
  responseDeadline: Date;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string;

  @Column({ type: 'simple-array', nullable: true })
  assignedTeam: string[];

  @Column({ type: 'simple-array', nullable: true })
  documentIds: string[];

  @Column({ type: 'varchar', length: 10, default: 'high' })
  priority: string;

  @ManyToOne(() => IdentityUser, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser: IdentityUser;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdById: string;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date;

  @Column({ type: 'text', nullable: true })
  result: string;

  @Column({ type: 'boolean', default: false })
  followUpRequired: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  resolvedBy: string;
}
