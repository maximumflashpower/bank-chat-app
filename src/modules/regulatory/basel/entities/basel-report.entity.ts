import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('reg_basel_reports')
export class BaselReport extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 30 })
  reportType: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  capitalAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  riskWeightedAssets: number;

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  capitalRatio: number;

  @Column({ type: 'varchar', length: 20 })
  period: string;

  @Column({ type: 'int', default: 0 })
  quarter: number;

  @Column({ type: 'int', default: 0 })
  year: number;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date;
}
