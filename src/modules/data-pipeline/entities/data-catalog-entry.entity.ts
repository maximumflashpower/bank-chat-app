import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';

/**
 * Entrada del catálogo de datos — discovery y metadata
 * Tabla: data_catalog_entries
 * Función: BBC-DLP-V3-005
 */
@Entity('data_catalog_entries')
export class DataCatalogEntry extends BaseEntity {
  @ApiProperty({ description: 'Nombre del dataset/table', example: 'ledger_transactions' })
  @Column({ name: 'dataset_name', type: 'varchar', length: 255, unique: true })
  datasetName: string;

  @ApiProperty({ description: 'Descripción del dataset', example: 'Transacciones del libro mayor' })
  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Esquema JSON del dataset', example: '{"columns":[{"name":"amount","type":"numeric"}]}' })
  @Column({ name: 'schema_definition', type: 'jsonb' })
  schemaDefinition: Record<string, unknown>;

  @ApiProperty({ description: 'Tags de categorización', example: '["financial","pii"]' })
  @Column({ name: 'tags', type: 'simple-array', default: '{}' })
  tags: string[];

  @ApiProperty({ description: 'Tabla origen en PostgreSQL', example: 'ledger_transactions' })
  @Column({ name: 'source_table', type: 'varchar', length: 255, nullable: true })
  sourceTable: string | null;

  @ApiProperty({ description: 'Owner del dataset', example: 'data-team' })
  @Column({ name: 'owner', type: 'varchar', length: 255, nullable: true })
  owner: string | null;

  @ApiProperty({ description: 'Nivel de sensibilidad de datos', example: 'pii' })
  @Column({ name: 'classification', type: 'varchar', length: 50, default: 'internal' })
  classification: string;

  @ApiProperty({ description: 'Política de retención', example: '7 years (SOX)' })
  @Column({ name: 'retention_policy', type: 'varchar', length: 100, nullable: true })
  retentionPolicy: string | null;

  @ApiProperty({ description: 'Lineage upstream (IDs de datasets padres)' })
  @Column({ name: 'lineage_upstream', type: 'simple-array', default: '{}' })
  lineageUpstream: string[];

  @ApiProperty({ description: 'Lineage downstream (IDs de datasets hijos)' })
  @Column({ name: 'lineage_downstream', type: 'simple-array', default: '{}' })
  lineageDownstream: string[];

  @ApiProperty({ description: 'Score de calidad de datos 0-100', example: 95 })
  @Column({ name: 'quality_score', type: 'integer', nullable: true })
  qualityScore: number | null;
}
