import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

@Entity('datagov_lineage')
export class DatagovLineage extends BaseEntity {
  @Column({ name: 'entity_identifier', type: 'varchar', length: 255, nullable: false })
  entityIdentifier: string;

  @Column({ name: 'source_system', type: 'varchar', length: 100, nullable: false })
  sourceSystem: string;

  @Column({ name: 'target_system', type: 'varchar', length: 100, nullable: false })
  targetSystem: string;

  @Column({ name: 'transformations', type: 'jsonb', nullable: true })
  transformations: Record<string, unknown>[] | null;

  @Column({ name: 'crosses_border', type: 'boolean', default: false })
  crossesBorder: boolean;

  @Column({ name: 'countries_involved', type: 'text', array: true, nullable: true })
  countriesInvolved: string[] | null;

  @Column({ name: 'contains_pii', type: 'boolean', default: false })
  containsPii: boolean;

  @Column({ name: 'flow_description', type: 'text', nullable: true })
  flowDescription: string | null;
}
