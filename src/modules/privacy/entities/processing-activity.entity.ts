import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { ConsentLegalBasis } from './consent-legal-basis.enum';

/**
 * Registro de actividad de procesamiento Art 30 GDPR
 * Tabla: privacy_processing_activity
 * Funciones: PRIV-ART30-001 a PRIV-ART30-005
 */
@Entity('privacy_processing_activities')
export class ProcessingActivity extends BaseEntity {
  @ApiProperty({ description: 'Nombre del proceso de tratamiento' })
  @Column({ name: 'activity_name', type: 'varchar', length: 255 })
  activityName: string;

  @ApiProperty({ description: 'Propósito del tratamiento de datos' })
  @Column({ name: 'purpose', type: 'text' })
  purpose: string;

  @ApiProperty({
    description: 'Categorías de datos personales tratados',
    isArray: true,
    example: ['identifying', 'contact_info', 'financial'],
  })
  @Column({ name: 'data_categories', type: 'simple-array' })
  dataCategories: string[];

  @ApiProperty({
    description: 'Tipos de titulares de datos',
    isArray: true,
    example: ['clients', 'employees'],
  })
  @Column({ name: 'data_subjects', type: 'simple-array' })
  dataSubjects: string[];

  @ApiProperty({
    description: 'Base legal para el procesamiento',
    enum: ConsentLegalBasis,
    example: 'consent',
  })
  @Column({ name: 'legal_basis', type: 'varchar', length: 50 })
  legalBasis: ConsentLegalBasis;

  @ApiProperty({
    description: 'Terceros con acceso a los datos',
    isArray: true,
    required: false,
    example: ['Proveedor A', 'Proveedor B'],
  })
  @Column({ name: 'recipients', type: 'simple-array', nullable: true })
  recipients: string[] | null;

  @ApiProperty({
    description: 'Países de destino para transferencias internacionales',
    isArray: true,
    required: false,
    example: ['US', 'MX'],
  })
  @Column({ name: 'transfer_countries', type: 'simple-array', nullable: true })
  transferCountries: string[] | null;

  @ApiProperty({
    description: 'Tiempo de retención de datos',
    example: '5 años',
  })
  @Column({ name: 'retention_period', type: 'varchar', length: 50, nullable: true })
  retentionPeriod: string | null;

  @ApiProperty({
    description: 'Medidas técnicas y organizativas de seguridad',
    isArray: true,
    required: false,
    example: ['Cifrado AES-256', 'Control de acceso RBAC'],
  })
  @Column({ name: 'security_measures', type: 'simple-array', nullable: true })
  securityMeasures: string[] | null;

  @ApiProperty({
    description: 'Aprobado por DPO',
    default: false,
  })
  @Column({ name: 'dpo_approved', type: 'boolean', default: false })
  dpoApproved: boolean;
}
