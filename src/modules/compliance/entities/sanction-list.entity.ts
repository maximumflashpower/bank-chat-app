import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ListSource } from './list-source.enum';

@Entity('sanction_lists')
export class SanctionList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source', type: 'varchar', length: 50 })
  source: ListSource;

  @Column({ name: 'entry_count', type: 'int', default: 0 })
  entryCount: number;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date;

  @Column({ name: 'sync_status', type: 'varchar', length: 20, default: 'idle' })
  syncStatus: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
