import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('reg_regulatory_changes')
export class RegulatoryChange extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100 })
  jurisdiction: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  changeType: string;

  @Column({ type: 'timestamptz', nullable: true })
  effectiveDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  impactStatus: string;

  @Column({ type: 'text', nullable: true })
  impactAssessment: string;

  @Column({ type: 'text', nullable: true })
  actionPlan: string;
}
