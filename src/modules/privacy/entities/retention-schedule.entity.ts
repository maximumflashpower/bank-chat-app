import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { RetentionAction } from './retention-action.enum';

/**
 * Programa de retención y eliminación automática de datos
 * Tabla: privacy_retention_schedules
 * Funciones: PRIV-PBDESIGN-004 a PRIV-PBDESIGN-005
 */
@Entity('privacy_retention_schedules')
export class RetentionSchedule extends BaseEntity {
  @ApiProperty({ description: 'Nombre del programa de retención' })
  @Column({ name: 'schedule_name', type: 'varchar', length: 255 })
  scheduleName: string;

  @ApiProperty({ description: 'Entidad/tabla afectada por este esquema' })
  @Column({ name: 'target_table', type: 'varchar', length: 100 })
  targetTable: string;

  @ApiProperty({ description: 'Tipo de dato almacenado' })
  @Column({ name: 'data_type', type: 'varchar', length: 100, nullable: true })
  dataType: string | null;

  @ApiProperty({ description: 'Período de retención en días' })
  @Column({ name: 'retention_days', type: 'integer' })
  retentionDays: number;

  @ApiProperty({
    description: 'Condición de inicio del contador',
    example: 'last_modified_date',
  })
  @Column({ name: 'start_date_field', type: 'varchar', length: 100, default: 'created_at' })
  startDateField: string;

  @ApiProperty({
    description: 'Acción automática al expirar retención',
    enum: RetentionAction,
    example: 'anonymize',
  })
  @Column({ name: 'expiration_action', type: 'varchar', length: 20, default: 'anonymize' })
  expirationAction: RetentionAction;

  @ApiProperty({ description: 'Días adicionales antes de acción (grace period)' })
  @Column({ name: 'grace_period_days', type: 'integer', default: 0 })
  gracePeriodDays: number;

  @ApiProperty({
    description: '¿Es obligatorio legalmente?',
    example: true,
  })
  @Column({ name: 'mandatory_legal_requirement', type: 'boolean', default: false })
  mandatoryLegalRequirement: boolean;

  @ApiProperty({
    description: 'Normativa específica que requiere esta retención',
    required: false,
  })
  @Column({ name: 'legal_reference', type: 'text', nullable: true })
  legalReference: string | null;

  @ApiProperty({
    description: 'Campo que contiene la marca temporal de última actividad',
    required: false,
  })
  @Column({ name: 'last_activity_field', type: 'varchar', length: 100, nullable: true })
  lastActivityField: string | null;

  @ApiProperty({
    description: 'Estado del programa de retención',
    example: 'active',
  })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Quién aprobó el esquema' })
  @Column({ name: 'approved_by', type: 'varchar', length: 255, nullable: true })
  approvedBy: string | null;

  @ApiProperty({ description: 'Fecha de aprobación' })
  @Column({ name: 'approval_date', type: 'date', nullable: true })
  approvalDate: Date | null;

  @ApiProperty({
    description: 'Última ejecución automática del scheduler',
    required: false,
  })
  @Column({ name: 'last_execution_at', type: 'timestamptz', nullable: true })
  lastExecutionAt: Date | null;

  @ApiProperty({
    description: 'Registros procesados en última ejecución',
    default: 0,
  })
  @Column({ name: 'records_processed_last_run', type: 'integer', default: 0 })
  recordsProcessedLastRun: number;

  @ApiProperty({ description: 'Próxima ejecución programada' })
  @Column({ name: 'next_scheduled_run', type: 'timestamp', nullable: true })
  nextScheduledRun: Date | null;
}
