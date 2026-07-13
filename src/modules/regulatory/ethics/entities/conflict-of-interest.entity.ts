import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('reg_coi_declarations')
export class ConflictOfInterest extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'text' })
  declaration: string;

  @Column({ type: 'simple-array', nullable: true })
  relatedVendors: string[];

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  screeningStatus: string;

  @Column({ type: 'text', nullable: true })
  mitigationPlan: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  approvalStatus: string;

  @Column({ type: 'timestamptz', nullable: true })
  declaredAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date;
}
