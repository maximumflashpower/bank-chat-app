import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

export enum SegmentType {
  BRANCH = 'branch',
  DEPARTMENT = 'department',
  PROJECT = 'project',
  COST_CENTER = 'cost_center',
  OTHER = 'other',
}

export enum SegmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('ledger_segments')
export class LedgerSegment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'segment_code', type: 'varchar', length: 50, unique: true })
  segmentCode: string;

  @Column({ name: 'segment_name', type: 'varchar', length: 255 })
  segmentName: string;

  @Column({ name: 'segment_type', type: 'varchar', length: 20 })
  segmentType: SegmentType;

  @Index()
  @Column({ name: 'parent_segment_id', type: 'uuid', nullable: true })
  parentSegmentId: string | null;

  @ManyToOne(() => LedgerSegment, { nullable: true, eager: false })
  @JoinColumn({ name: 'parent_segment_id' })
  parentSegment: LedgerSegment;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: SegmentStatus;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
