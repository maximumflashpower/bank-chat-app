import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';
import { DsarRequestType } from './dsar-request-type.enum';
import { DsarStatus } from './dsar-status.enum';
import { DsarReceivedChannel } from './dsar-received-channel.enum';

/**
 * Solicitud DSAR (Data Subject Access Request)
 * Tabla: privacy_dsar_request
 * Funciones: PRIV-DSAR-001 a PRIV-DSAR-010
 */
@Entity('privacy_dsar_requests')
export class DsarRequest extends BaseEntity {
  @ApiProperty({ description: 'Usuario solicitante' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({
    description: 'Tipo de solicitud DSAR según derechos GDPR',
    enum: DsarRequestType,
    example: 'access',
  })
  @Column({ name: 'request_type', type: 'varchar', length: 30 })
  requestType: DsarRequestType;

  @ApiProperty({
    description: 'Estado del workflow DSAR',
    enum: DsarStatus,
    example: 'received',
  })
  @Column({ name: 'status', type: 'varchar', length: 20, default: 'received' })
  status: DsarStatus;

  @ApiProperty({
    description: 'Canal por el que se recibió la solicitud',
    enum: DsarReceivedChannel,
    example: 'web',
  })
  @Column({ name: 'received_channel', type: 'varchar', length: 50, nullable: true })
  receivedChannel: DsarReceivedChannel | null;

  @ApiProperty({
    description: 'Plazo legal para responder (30 días por defecto)',
    example: '2026-08-04T00:00:00Z',
  })
  @Column({ name: 'deadline', type: 'timestamptz' })
  deadline: Date;

  @ApiProperty({ description: 'URL del paquete de datos compilado' })
  @Column({ name: 'data_package_url', type: 'text', nullable: true })
  dataPackageUrl: string | null;

  @ApiProperty({ description: 'Tamaño del paquete en bytes' })
  @Column({ name: 'data_package_size', type: 'bigint', nullable: true })
  dataPackageSize: number | null;

  @ApiProperty({ description: 'Notas internas del DPO' })
  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string | null;

  @ApiProperty({ description: 'Fecha de completitud' })
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  // --- Relaciones ---
  @ManyToOne(() => IdentityUser, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;
}
