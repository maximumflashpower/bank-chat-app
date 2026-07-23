import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('validation_rule')
export class ValidationRule extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 255 })
  ruleName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  category: 'referential' | 'consistency' | 'cross-tabular' | 'range' | 'format' | 'completeness';

  @Column({ type: 'jsonb' })
  condition: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'warning' })
  severity: 'info' | 'warning' | 'critical' | 'blocking';

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'deprecated';

  @Column({ type: 'jsonb', nullable: true })
  expectedValues?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  errorMessages?: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  affectedReports?: string[];

  @Column({ type: 'jsonb', nullable: true })
  affectedTables?: string[];

  @Column({ type: 'jsonb', nullable: true })
  affectedColumns?: Array<{ table: string; column: string }>;

  @Column({ type: 'int', default: 0 })
  triggerCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  lastResult?: 'success' | 'failure' | 'warning' | 'error';

  @Column({ type: 'jsonb', nullable: true })
  lastValidationError?: Record<string, unknown>;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
