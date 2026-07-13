import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('reg_surveillance_alerts')
export class SurveillanceAlert extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 50 })
  alertType: string;

  @Column({ type: 'varchar', length: 50 })
  instrumentSymbol: string;

  @Column({ type: 'simple-array' })
  transactionIds: string[];

  @Column({ type: 'uuid' })
  traderId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  confidenceScore: number;

  @Column({ type: 'jsonb' })
  patternDetail: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  caseId: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  detectedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  investigationNotes: string;
}
