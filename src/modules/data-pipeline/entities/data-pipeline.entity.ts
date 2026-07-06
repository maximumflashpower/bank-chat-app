import { Entity, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { PipelineSourceType } from './pipeline-source-type.enum';
import { PipelineStatus } from './pipeline-status.enum';

/**
 * Entidad pipeline de data ingestion/streaming
 * Tabla: data_pipelines
 * Funciones: BBC-DLP-V3-001 a 020
 */
@Entity('data_pipelines')
export class DataPipeline extends BaseEntity {
  @ApiProperty({ description: 'Nombre del pipeline', example: 'kafka-transactions-ingest' })
  @Column({ name: 'name', type: 'varchar', length: 255, unique: true })
  name: string;

  @ApiProperty({ 
    description: 'Tipo de fuente', 
    enum: PipelineSourceType,
    example: PipelineSourceType.KAFKA 
  })
  @Column({ 
    name: 'source_type', 
    type: 'enum', 
    enum: PipelineSourceType,
  })
  sourceType: PipelineSourceType;

  @ApiProperty({ 
    description: 'Configuración JSON de la fuente (brokers, topics, etc)',
    example: '{"brokers":["localhost:9092"],"topics":["transactions"]}'
  })
  @Column({ name: 'source_config', type: 'jsonb' })
  sourceConfig: Record<string, unknown>;

  @ApiProperty({ 
    description: 'Destino de datos',
    example: 's3://datalake/warehouse/transactions/'
  })
  @Column({ name: 'destination', type: 'text' })
  destination: string;

  @ApiProperty({ 
    description: 'ID del schema registry asociado',
    nullable: true,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  @Column({ name: 'schema_id', type: 'uuid', nullable: true })
  schemaId: string | null;

  @ApiProperty({ 
    description: 'Schedule cron expression',
    required: false,
    example: '*/5 * * * *'
  })
  @Column({ name: 'schedule', type: 'varchar', length: 100, nullable: true })
  schedule: string | null;

  @ApiProperty({ enum: PipelineStatus, example: PipelineStatus.ACTIVE })
  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: PipelineStatus,
    default: PipelineStatus.DRAFT 
  })
  status: PipelineStatus;

  @ApiProperty({ 
    description: 'Última ejecución exitosa',
    nullable: true
  })
  @Column({ name: 'last_run_at', type: 'timestamptz', nullable: true })
  lastRunAt: Date | null;

  @ApiProperty({ 
    description: 'Throughput registros por segundo',
    nullable: true,
    example: 1500.50
  })
  @Column({ 
    name: 'throughput_rps', 
    type: 'numeric', 
    precision: 12,
    scale: 2,
    nullable: true 
  })
  throughputRps: number | null;

  @ApiProperty({ description: 'Errores totales desde última recuperación', default: 0 })
  @Column({ name: 'error_count', type: 'integer', default: 0 })
  errorCodeCount: number;

  @ApiProperty({ description: 'Configuración avanzada', nullable: true })
  @Column({ name: 'advanced_options', type: 'jsonb', nullable: true })
  advancedOptions: Record<string, unknown> | null;
}
