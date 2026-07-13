import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('reg_sox_controls')
export class SoxControl extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  controlIdRef: string;

  @Column({ type: 'text' })
  controlDescription: string;

  @Column({ type: 'varchar', length: 50 })
  riskCategory: string;

  @Column({ type: 'uuid', name: 'process_owner_id', nullable: true })
  processOwnerId: string;

  @Column({ type: 'varchar', length: 20 })
  testFrequency: string;

  @Column({ type: 'varchar', length: 50 })
  testMethod: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastTestedAt: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  lastTestResult: string;

  @Column({ type: 'int', default: 0 })
  deficiencyCount: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  assertionStatus: string;

  @Column({ type: 'text', nullable: true })
  evidenceLink: string;
}
