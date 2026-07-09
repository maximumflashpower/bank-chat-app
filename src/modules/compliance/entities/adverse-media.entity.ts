import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('adverse_media_results')
export class AdverseMediaResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_name', type: 'varchar', length: 255 })
  entityName: string;

  @Column({ name: 'source_url', type: 'varchar', length: 500 })
  sourceUrl: string;

  @Column({ name: 'headline', type: 'varchar', length: 500 })
  headline: string;

  @Column({ name: 'published_date', type: 'timestamptz', nullable: true })
  publishedDate: Date;

  @Column({ name: 'severity', type: 'varchar', length: 20, default: 'medium' })
  severity: string;

  @Column({ name: 'categories', type: 'jsonb', nullable: true })
  categories: string[];

  @Column({ name: 'is_relevant', type: 'boolean', default: true })
  isRelevant: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
