import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';

/**
 * Directorio de contactos del Data Protection Officer
 * Tabla: privacy_dpo_contacts
 * Función: PRIV-MISC-002
 */
@Entity('privacy_dpo_contacts')
export class DpoContact extends BaseEntity {
  @ApiProperty({ description: 'Nombre completo del DPO' })
  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  @ApiProperty({ description: 'Email de contacto' })
  @Column({ name: 'email', type: 'varchar', length: 255 })
  email: string;

  @ApiProperty({ description: 'Teléfono de contacto' })
  @Column({ name: 'phone', type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Rol/organización' })
  @Column({ name: 'organization', type: 'varchar', length: 255 })
  organization: string;

  @ApiProperty({ description: 'Jurisdicción responsable (ej. EU, UK, MX)' })
  @Column({ name: 'jurisdiction', type: 'varchar', length: 50, nullable: true })
  jurisdiction: string | null;

  @ApiProperty({ description: 'Es el DPO principal activo' })
  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @ApiProperty({ description: 'Contacto activo' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
