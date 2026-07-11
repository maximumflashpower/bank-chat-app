import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { AllocationDriver } from './allocation-driver.enum';
import { AllocationFrequency } from './allocation-frequency.enum';

@Entity('smb_overhead_allocation_method')
export class OverheadAllocationMethod extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  companyId: string;

  @Column({ type: 'varchar', length: 255 })
  methodName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: AllocationDriver
  })
  driverType: AllocationDriver;

  @Column({
    type: 'enum',
    enum: AllocationFrequency,
    default: AllocationFrequency.MONTHLY
  })
  frequency: AllocationFrequency;

  @Column({ type: 'jsonb', nullable: true })
  driverSources: Record<string, unknown>;

  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true })
  fixedRate: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
