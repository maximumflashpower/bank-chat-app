import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { ChangeImpact } from './change-impact.enum';
import { ChangeStatus } from './change-status.enum';

/**
 * Solicitud de cambio controlada con CAB y rollback
 * Tabla: change_requests
 * Funciones: CHG-MGMT-001 a 010
 */
@Entity('change_requests')
export class ChangeRequest extends BaseEntity {
  @ApiProperty({ description: 'Título del cambio', example: 'Deploy ledger v2.1 with new transfer logic' })
  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Detalle técnico del cambio' })
  @Column({ name: 'description', type: 'text' })
  description: string;

  @ApiProperty({ enum: ChangeImpact, example: ChangeImpact.MEDIUM })
  @Column({ name: 'impact_level', type: 'enum', enum: ChangeImpact, default: ChangeImpact.MEDIUM })
  impactLevel: ChangeImpact;

  @ApiProperty({ description: 'Score de riesgo 0-10', example: 4.5 })
  @Column({ name: 'risk_score', type: 'numeric', precision: 3, scale: 1, default: 0 })
  riskScore: number;

  @ApiProperty({ enum: ChangeStatus, example: ChangeStatus.SUBMITTED })
  @Column({ name: 'status', type: 'enum', enum: ChangeStatus, default: ChangeStatus.SUBMITTED })
  status: ChangeStatus;

  @ApiProperty({ description: 'Plan de rollback' })
  @Column({ name: 'rollback_plan', type: 'text' })
  rollbackPlan: string;

  @ApiProperty({ description: 'Feature flag asociado', nullable: true, example: 'ledger_v2_transfer' })
  @Column({ name: 'feature_flag', type: 'varchar', length: 100, nullable: true })
  featureFlag: string | null;

  @ApiProperty({ description: 'Porcentaje de rollout (0, 5, 25, 50, 100)', default: 0 })
  @Column({ name: 'rollout_pct', type: 'integer', default: 0 })
  rolloutPct: number;

  @ApiProperty({ description: 'Aprobador CAB', nullable: true })
  @Column({ name: 'cab_approved_by', type: 'uuid', nullable: true })
  cabApprovedBy: string | null;

  @ApiProperty({ description: 'Solicitante' })
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ApiProperty({ description: 'Fecha de implementación', nullable: true })
  @Column({ name: 'implemented_at', type: 'timestamptz', nullable: true })
  implementedAt: Date | null;
}
