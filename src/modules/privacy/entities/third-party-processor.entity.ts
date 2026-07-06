import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { ProcessorAgreementStatus } from './processor-agreement-status.enum';

/**
 * Registro de acuerdos con terceros procesadores de datos
 * Tabla: privacy_third_party_processors
 * Función: PRIV-MISC-004
 */
@Entity('privacy_third_party_processors')
export class ThirdPartyProcessor extends BaseEntity {
  @ApiProperty({ description: 'Nombre del procesador' })
  @Column({ name: 'processor_name', type: 'varchar', length: 255 })
  processorName: string;

  @ApiProperty({ description: 'Tipo de servicio prestado' })
  @Column({ name: 'service_type', type: 'varchar', length: 100 })
  serviceType: string;

  @ApiProperty({ description: 'Categorías de datos compartidas', isArray: true })
  @Column({ name: 'data_categories', type: 'simple-array' })
  dataCategories: string[];

  @ApiProperty({ description: 'Propósito del procesamiento' })
  @Column({ name: 'purpose', type: 'text' })
  purpose: string;

  @ApiProperty({ description: 'Países de transferencia', isArray: true, required: false })
  @Column({ name: 'transfer_countries', type: 'simple-array', nullable: true })
  transferCountries: string[] | null;

  @ApiProperty({ description: 'Garantías de transferencia (SCC/BCR)' })
  @Column({ name: 'transfer_mechanism', type: 'varchar', length: 100, nullable: true })
  transferMechanism: string | null;

  @ApiProperty({ description: 'Estado del acuerdo', enum: ProcessorAgreementStatus })
  @Column({ name: 'agreement_status', type: 'varchar', length: 20, default: 'active' })
  agreementStatus: ProcessorAgreementStatus;

  @ApiProperty({ description: 'Fecha del acuerdo' })
  @Column({ name: 'agreement_date', type: 'date' })
  agreementDate: Date;

  @ApiProperty({ description: 'Fecha de expiración' })
  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date | null;

  @ApiProperty({ description: 'Documento de referencia (URL o path)' })
  @Column({ name: 'document_ref', type: 'text', nullable: true })
  documentRef: string | null;
}
