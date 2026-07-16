import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum DatasetType {
  TABLE = 'table',
  VIEW = 'view',
  FILE = 'file',
  STREAM = 'stream',
  API = 'api',
}

@Entity('datagov_catalog_entry')
export class DatagovCatalogEntry extends BaseEntity {
  @Column({ name: 'dataset_name', type: 'varchar', length: 255, nullable: false, unique: true })
  datasetName: string;

  @Column({ name: 'dataset_type', type: 'varchar', length: 50, nullable: false })
  datasetType: DatasetType;

  @Column({ name: 'source_system', type: 'varchar', length: 100, nullable: false })
  sourceSystem: string;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ name: 'steward_id', type: 'uuid', nullable: true })
  stewardId: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'schema_definition', type: 'jsonb', nullable: true })
  schemaDefinition: Record<string, unknown> | null;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'quality_score', type: 'numeric', precision: 5, scale: 2, nullable: true })
  qualityScore: number | null;

  @Column({ name: 'pii_present', type: 'boolean', default: false })
  piiPresent: boolean;

  @Column({ name: 'classification_label', type: 'varchar', length: 20, nullable: true })
  classificationLabel: string | null;

  @Column({ name: 'last_updated', type: 'timestamptz', nullable: true })
  lastUpdated: Date | null;
}
