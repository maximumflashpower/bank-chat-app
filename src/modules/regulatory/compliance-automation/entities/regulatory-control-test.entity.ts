import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('regulatory_control_tests')
export class RegulatoryControlTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'control_id' })
  controlId: string;

  @Column({ type: 'uuid', name: 'tested_by' })
  testedBy: string;

  @Column({ type: 'date' })
  testDate: Date;

  @Column({ type: 'varchar', length: 20 })
  result: 'pass' | 'fail' | 'warning';

  @Column({ type: 'text', nullable: true })
  findings: string;

  @Column({ type: 'text', nullable: true })
  remediationPlan: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  evidencePath: string;

  @Column({ type: 'varchar', length: 20, default: 'completed' })
  status: 'completed' | 'in_remediation' | 're_tested';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
