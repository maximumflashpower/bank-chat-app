import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EntityType } from './entity-type.enum';
import { ListSource } from './list-source.enum';
import { ScreeningStatus } from './screening-status.enum';

@Entity('screening_results')
export class ScreeningResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_name', type: 'varchar', length: 255 })
  entityName: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 20 })
  entityType: EntityType;

  @Column({ name: 'list_source', type: 'varchar', length: 50 })
  listSource: ListSource;

  @Column({ name: 'match_score', type: 'numeric', precision: 5, scale: 2 })
  matchScore: number;

  @Column({ name: 'matched_name', type: 'varchar', length: 255, nullable: true })
  matchedName: string;

  @Column({ name: 'matched_entity_id', type: 'varchar', length: 100, nullable: true })
  matchedEntityId: string;

  @Column({ name: 'is_blocked', type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string;

  @Column({ type: 'varchar', length: 20, default: ScreeningStatus.PENDING })
  status: ScreeningStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
