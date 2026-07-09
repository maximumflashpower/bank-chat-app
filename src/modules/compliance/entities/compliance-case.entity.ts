import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('compliance_cases')
export class ComplianceCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'alert_id', type: 'uuid' })
  alertId: string;

  @Column({ name: 'case_type', type: 'varchar', length: 20 })
  caseType: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'analyst_id', type: 'uuid', nullable: true })
  analystId: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ name: 'evidence', type: 'jsonb', nullable: true })
  evidence: Record<string, any>[];

  @Column({ name: 'sar_generated', type: 'boolean', default: false })
  sarGenerated: boolean;

  @Column({ name: 'sar_file_url', type: 'varchar', length: 500, nullable: true })
  sarFileUrl: string;

  @Column({ name: 'submitted_to_authority', type: 'boolean', default: false })
  submittedToAuthority: boolean;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
