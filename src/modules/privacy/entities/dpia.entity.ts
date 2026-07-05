import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { ProcessingActivity } from './processing-activity.entity';
import { DpiaRiskLevel } from './dpia-risk-level.enum';
import { DpiaStatus } from './dpia-status.enum';

/**
 * Evaluación de Impacto en la Protección de Datos (DPIA)
 * Tabla: privacy_dpiassessment
 * Funciones: PRIV-DPIA-001 a PRIV-DPIA-003
 */
@Entity('privacy_dpiassessments')
export class Dpia extends BaseEntity {
  @ApiProperty({ description: 'Actividad de procesamiento evaluada' })
  @Column({ name: 'activity_id', type: 'uuid' })
  activityId: string;

  @ApiProperty({
    description: 'Nivel de riesgo identificado',
    enum: DpiaRiskLevel,
    example: 'high',
  })
  @Column({ name: 'risk_level', type: 'varchar', length: 10 })
  riskLevel: DpiaRiskLevel;

  @ApiProperty({ description: 'Descripción del riesgo identificado' })
  @Column({ name: 'risk_description', type: 'text', nullable: true })
  riskDescription: string | null;

  @ApiProperty({ description: 'Medidas de mitigación propuestas' })
  @Column({ name: 'mitigation_measures', type: 'text', nullable: true })
  mitigationMeasures: string | null;

  @ApiProperty({
    description: 'Riesgo residual tras aplicar mitigación',
    enum: DpiaRiskLevel,
    required: false,
    example: 'medium',
  })
  @Column({ name: 'residual_risk', type: 'varchar', length: 10, nullable: true })
  residualRisk: DpiaRiskLevel | null;

  @ApiProperty({
    description: 'Consulta al DPO realizada',
    default: false,
  })
  @Column({ name: 'consulted_dpo', type: 'boolean', default: false })
  consultedDpo: boolean;

  @ApiProperty({
    description: 'Opinión del DPO sobre la evaluación',
    required: false,
  })
  @Column({ name: 'dpo_opinion', type: 'text', nullable: true })
  dpoOpinion: string | null;

  @ApiProperty({
    description: 'Autoridad supervisora notificada',
    default: false,
  })
  @Column({ name: 'supervisory_authority_notified', type: 'boolean', default: false })
  supervisoryAuthorityNotified: boolean;

  @ApiProperty({
    description: 'Estado del DPIA',
    enum: DpiaStatus,
    example: 'draft',
  })
  @Column({ name: 'status', type: 'varchar', length: 20, default: 'draft' })
  status: DpiaStatus;

  @ApiProperty({ description: 'Autor del DPIA' })
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  // --- Relaciones ---
  @ManyToOne(() => ProcessingActivity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: ProcessingActivity;
}
