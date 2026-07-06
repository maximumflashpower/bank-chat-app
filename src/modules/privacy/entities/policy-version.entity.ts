import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { PolicyVersionStatus } from './policy-version-status.enum';

/**
 * Versionado de política de privacidad con tracking de aceptación
 * Tabla: privacy_policy_versions
 * Función: PRIV-MISC-001
 */
@Entity('privacy_policy_versions')
export class PolicyVersion extends BaseEntity {
  @ApiProperty({ description: 'Número de versión SemVer', example: '1.0' })
  @Column({ name: 'version', type: 'varchar', length: 20 })
  version: string;

  @ApiProperty({ description: 'Contenido completo de la política' })
  @Column({ name: 'content', type: 'text' })
  content: string;

  @ApiProperty({ description: 'Checksum para integridad (SHA-256)' })
  @Column({ name: 'checksum', type: 'char', length: 64, nullable: true })
  checksum: string | null;

  @ApiProperty({ description: 'Estado de la versión', enum: PolicyVersionStatus })
  @Column({ name: 'status', type: 'varchar', length: 20, default: 'draft' })
  status: PolicyVersionStatus;

  @ApiProperty({ description: 'Fecha de publicación' })
  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ description: 'Publicado por' })
  @Column({ name: 'published_by', type: 'varchar', length: 255, nullable: true })
  publishedBy: string | null;

  @ApiProperty({ description: 'Cantidad de usuarios que han aceptado' })
  @Column({ name: 'acceptance_count', type: 'integer', default: 0 })
  acceptanceCount: number;

  @ApiProperty({ description: 'Requiere re-consentimiento explícito' })
  @Column({ name: 'requires_reconsent', type: 'boolean', default: false })
  requiresReconsent: boolean;
}
