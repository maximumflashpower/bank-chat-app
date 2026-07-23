import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('reporting_category')
export class ReportingCategory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  categoryName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: 'regulatory' })
  categoryType: 'regulatory' | 'internal' | 'management' | 'statutory';

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: 'active' | 'inactive';

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
