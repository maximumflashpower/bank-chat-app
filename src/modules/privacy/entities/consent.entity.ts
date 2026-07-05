import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';
import { ConsentPurpose } from './consent-purpose.enum';
import { ConsentLegalBasis } from './consent-legal-basis.enum';

/**
 * Registro de consentimiento granular por propósito
 * Tabla: privacy_consent
 * Funciones: PRIV-CONSENT-001 a PRIV-CONSENT-005
 */
@Entity('privacy_consents')
export class Consent extends BaseEntity {
  @ApiProperty({ description: 'Usuario que otorga el consentimiento' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({
    description: 'Propósito del procesamiento de datos',
    enum: ConsentPurpose,
    example: 'marketing',
  })
  @Column({ name: 'purpose', type: 'varchar', length: 100 })
  purpose: ConsentPurpose;

  @ApiProperty({
    description: 'Base legal para el procesamiento según GDPR Art. 6(1)',
    enum: ConsentLegalBasis,
    example: 'consent',
  })
  @Column({ name: 'legal_basis', type: 'varchar', length: 50 })
  legalBasis: ConsentLegalBasis;

  @ApiProperty({ description: 'Estado del consentimiento', example: false })
  @Column({ name: 'granted', type: 'boolean', default: false })
  granted: boolean;

  @ApiProperty({ description: 'Fecha de otorgamiento del consentimiento' })
  @Column({ name: 'granted_at', type: 'timestamptz', nullable: true })
  grantedAt: Date | null;

  @ApiProperty({ description: 'Fecha de revocación del consentimiento' })
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @ApiProperty({
    description: 'Sub-consentimientos específicos (ej. email, sms, push)',
    example: '{"channels":["email","sms"],"thirdParties":["partnerA"]}',
  })
  @Column({ name: 'granularity', type: 'jsonb', nullable: true })
  granularity: Record<string, unknown> | null;

  @ApiProperty({
    description: 'Versión de la política de privacidad aceptada',
    example: '1.0',
  })
  @Column({ name: 'version', type: 'varchar', length: 10, nullable: true })
  version: string | null;

  @ApiProperty({ description: 'Dirección IP al otorgar consentimiento' })
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: 'Browser/OS al consentir' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  // --- Relaciones ---
  @ManyToOne(() => IdentityUser, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;
}
