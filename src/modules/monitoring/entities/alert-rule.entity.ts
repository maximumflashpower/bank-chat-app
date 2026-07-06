import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { MetricType } from './metric-type.enum';
import { AlertSeverity } from './alert-severity.enum';
import { AlertStatus } from './alert-status.enum';

/**
 * Reglas de alertas de monitoreo con umbrales y routing
 * Tabla: monitor_alert_rules
 * Funciones: MONITOR-RT-007 a 010
 */
@Entity('monitor_alert_rules')
export class AlertRule extends BaseEntity {
  @ApiProperty({ description: 'Nombre de la regla', example: 'High Error Rate - Ledger' })
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Servicio objetivo', example: 'ledger-service' })
  @Column({ name: 'service_name', type: 'varchar', length: 255 })
  serviceName: string;

  @ApiProperty({ enum: MetricType, example: MetricType.ERROR_RATE })
  @Column({ name: 'metric_type', type: 'enum', enum: MetricType })
  metricType: MetricType;

  @ApiProperty({ description: 'Operador de comparación', example: '>' })
  @Column({ name: 'operator', type: 'varchar', length: 10 })
  operator: string;

  @ApiProperty({ description: 'Umbral de disparo', example: 5.0 })
  @Column({ name: 'threshold', type: 'numeric', precision: 14, scale: 4 })
  threshold: number;

  @ApiProperty({ enum: AlertSeverity, example: AlertSeverity.CRITICAL })
  @Column({ name: 'severity', type: 'enum', enum: AlertSeverity, default: AlertSeverity.WARNING })
  severity: AlertSeverity;

  @ApiProperty({ enum: AlertStatus, example: AlertStatus.ACTIVE })
  @Column({ name: 'status', type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE })
  status: AlertStatus;

  @ApiProperty({ description: 'Canales de notificación', example: '["pagerduty","slack"]' })
  @Column({ name: 'notification_channels', type: 'simple-array', default: '{}' })
  notificationChannels: string[];

  @ApiProperty({ description: 'Mensaje de la alerta', example: 'Error rate exceeds 5% on ledger-service' })
  @Column({ name: 'message_template', type: 'text', nullable: true })
  messageTemplate: string | null;

  @ApiProperty({ description: 'Ventana de tiempo en segundos', example: 300 })
  @Column({ name: 'window_seconds', type: 'integer', default: 300 })
  windowSeconds: number;
}
