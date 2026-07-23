import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('regulatory_lineage')
export class RegulatoryLineage extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 255 })
  reportName: string;

  @Column({ type: 'varchar', length: 500 })
  reportPath: string;

  @Column({ type: 'timestamp' })
  reportDate: Date;

  @Column({ type: 'jsonb' })
  dataSources: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  transformations: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  sourceFields: Array<{ table: string; column: string; entityType: string }>;

  @Column({ type: 'jsonb' })
  targetFields: Array<{ reportSection: string; fieldName: string; filingFormat: string }>;

  @Column({ type: 'jsonb', nullable: true })
  aggregations?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  calculations?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  transformationRules?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'manual' })
  lineageType: 'automatic' | 'manual' | 'hybrid';

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: 'draft' | 'review' | 'certified' | 'filed' | 'rejected';

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  auditTrail?: Array<{
    timestamp: string;
    user: string;
    action: string;
    details: Record<string, unknown>;
  }>;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  filedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  filedAt?: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
