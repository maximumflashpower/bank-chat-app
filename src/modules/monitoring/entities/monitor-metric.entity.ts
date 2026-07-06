import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { MetricType } from './metric-type.enum';

/**
 * Métricas de monitoreo de servicios en tiempo real
 * Tabla: monitor_metrics
 * Funciones: MONITOR-RT-001 a 006
 */
@Entity('monitor_metrics')
export class MonitorMetric extends BaseEntity {
  @ApiProperty({ description: 'Nombre del servicio monitoreado', example: 'ledger-service' })
  @Column({ name: 'service_name', type: 'varchar', length: 255 })
  serviceName: string;

  @ApiProperty({ enum: MetricType, example: MetricType.LATENCY })
  @Column({ name: 'metric_type', type: 'enum', enum: MetricType })
  metricType: MetricType;

  @ApiProperty({ description: 'Valor de la métrica', example: 45.7 })
  @Column({ name: 'value', type: 'numeric', precision: 14, scale: 4 })
  value: number;

  @ApiProperty({ description: 'Etiquetas adicionales (p50, p95, p99, etc.)', example: '{"percentile":"p99"}' })
  @Column({ name: 'labels', type: 'jsonb', default: '{}' })
  labels: Record<string, unknown>;

  @ApiProperty({ description: 'Si esta métrica disparó una alerta', default: false })
  @Column({ name: 'alert_triggered', type: 'boolean', default: false })
  alertTriggered: boolean;

  @ApiProperty({ description: 'Timestamp de registro', example: '2026-07-06T02:00:00Z' })
  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt: Date;
}
