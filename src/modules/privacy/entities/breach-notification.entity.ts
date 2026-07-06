import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { BreachSeverity } from './breach-severity.enum';
import { BreachStatus } from './breach-status.enum';

/**
 * Registro de brecha de datos según GDPR Art. 33/34
 * Tabla: privacy_breach_notifications
 * Funciones: PRIV-BREACH-001 a PRIV-BREACH-005
 */
@Entity('privacy_breach_notifications')
export class BreachNotification extends BaseEntity {
  @ApiProperty({ description: 'Título descriptivo de la brecha' })
  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    description: 'Descripción detallada del incidente',
  })
  description: string | null;

  @ApiProperty({
    description: 'Categoría principal de ataque según MITRE ATT&CK',
    example: 'Unauthorized Access',
  })
  @Column({ name: 'attack_category', type: 'varchar', length: 100, nullable: true })
  attackCategory: string | null;

  @ApiProperty({
    description: 'Origen de la detección (automático/manual/reportado)',
    example: 'automatic',
  })
  @Column({ name: 'detection_source', type: 'varchar', length: 50, default: 'manual' })
  detectionSource: string;

  @ApiProperty({
    description: 'Nivel de severidad',
    enum: BreachSeverity,
    example: 'high',
  })
  @Column({ name: 'severity_level', type: 'varchar', length: 10 })
  severityLevel: BreachSeverity;

  @ApiProperty({
    description: 'Estados del workflow de brecha',
    enum: BreachStatus,
    example: 'detected',
  })
  @Column({ name: 'status', type: 'varchar', length: 20, default: 'detected' })
  status: BreachStatus;

  @ApiProperty({ description: 'Número estimado de usuarios afectados' })
  @Column({ name: 'affected_user_count', type: 'integer', default: 0 })
  affectedUserCount: number;

  @ApiProperty({ description: 'Registro inicial del incidente' })
  @Column({ name: 'discovered_at', type: 'timestamptz' })
  discoveredAt: Date;

  @ApiProperty({
    description: 'Contenida en fecha (cuando se detuvo la fuga)',
    required: false,
  })
  @Column({ name: 'contained_at', type: 'timestamptz', nullable: true })
  containedAt: Date | null;

  @ApiProperty({
    description: 'Fecha límite para notificar autoridad (72h desde discovery)',
    required: false,
  })
  @Column({ name: 'notification_deadline', type: 'timestamptz', nullable: true })
  notificationDeadline: Date | null;

  @ApiProperty({ description: 'Fecha cuando se notificó autoridad supervisora' })
  @Column({ name: 'authority_notified_at', type: 'timestamptz', nullable: true })
  authorityNotifiedAt: Date | null;

  @ApiProperty({ description: 'Fecha cuando se notificaron usuarios afectados' })
  @Column({ name: 'users_notified_at', type: 'timestamptz', nullable: true })
  usersNotifiedAt: Date | null;

  @ApiProperty({ description: 'Nombre del investigador responsable' })
  @Column({ name: 'investigator_name', type: 'varchar', length: 255, nullable: true })
  investigatorName: string | null;

  @ApiProperty({ description: 'Notas del incidente' })
  incidentNotes: string | null;

  @ApiProperty({
    description: 'Datos afectados (categorías según Art 30)',
    isArray: true,
    required: false,
    example: ['identifying', 'contact_info', 'financial'],
  })
  @Column({ name: 'data_categories_affected', type: 'simple-array', nullable: true })
  dataCategoriesAffected: string[] | null;

  @ApiProperty({
    description: 'Causa raíz identificada',
    required: false,
  })
  rootCause: string | null;

  @ApiProperty({
    description: 'Acciones correctivas implementadas',
    required: false,
  })
  remediationActions: string | null;

  @ApiProperty({
    description: 'Hash para cadena de custodia forense',
    required: false,
  })
  @Column({ name: 'forensic_hash', type: 'char', length: 64, nullable: true })
  forensicHash: string | null;
}
