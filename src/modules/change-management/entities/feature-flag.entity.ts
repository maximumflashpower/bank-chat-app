import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';

/**
 * Feature flags para rollout gradual y dark launches
 * Tabla: feature_flags
 * Funciones: CHG-MGMT-008, 009
 */
@Entity('feature_flags')
export class FeatureFlag extends BaseEntity {
  @ApiProperty({ description: 'Nombre del flag', example: 'ledger_v2_transfer' })
  @Column({ name: 'flag_key', type: 'varchar', length: 100, unique: true })
  flagKey: string;

  @ApiProperty({ description: 'Descripción del flag' })
  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Si el flag está activo globalmente', default: false })
  @Column({ name: 'is_enabled', type: 'boolean', default: false })
  isEnabled: boolean;

  @ApiProperty({ description: 'Porcentaje de rollout 0-100', default: 0 })
  @Column({ name: 'rollout_percentage', type: 'integer', default: 0 })
  rolloutPercentage: number;

  @ApiProperty({ description: 'Lista de usuarios con acceso (whitelist)', example: '["user-uuid-1","user-uuid-2"]' })
  @Column({ name: 'targeted_users', type: 'simple-array', default: '{}' })
  targetedUsers: string[];

  @ApiProperty({ description: 'Configuración avanzada del flag' })
  @Column({ name: 'config', type: 'jsonb', default: '{}' })
  config: Record<string, unknown>;

  @ApiProperty({ description: 'Entorno (dev/staging/prod)', example: 'prod' })
  @Column({ name: 'environment', type: 'varchar', length: 20, default: 'prod' })
  environment: string;

  @ApiProperty({ description: 'Dark launch (oculto para usuarios)', default: false })
  @Column({ name: 'is_dark_launch', type: 'boolean', default: false })
  isDarkLaunch: boolean;
}
