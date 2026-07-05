import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { RoleType } from './role.enum';

@Entity({ name: 'identity_roles' })
export class Role extends BaseEntity {
  @ApiProperty({ enum: RoleType, example: RoleType.ADMIN })
  @Index({ unique: true })
  @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
  name: string;

  @ApiPropertyOptional({ example: 'Full system administrator' })
  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ example: ['users:read', 'users:write', 'ledger:transfer'] })
  @Column({
    name: 'permissions',
    type: 'text',
    array: true,
    default: '{}',
  })
  permissions: string[];

  @ApiProperty({ example: false })
  @Column({ name: 'is_system_role', type: 'boolean', default: false })
  isSystemRole: boolean;

  // ── Self-referencing hierarchy (parent_role_id) ──
  @ApiPropertyOptional({ type: () => String })
  @Column({ name: 'parent_role_id', type: 'uuid', nullable: true })
  parentRoleId: string | null;

  @ApiPropertyOptional({ type: () => Role })
  @ManyToOne(() => Role, (role) => role.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_role_id' })
  parentRole: Role | null;

  @ApiPropertyOptional({ type: () => [Role] })
  @OneToMany(() => Role, (role) => role.parentRole)
  children: Role[];

  // ── Org scope (nullable for global roles) ──
  @ApiPropertyOptional({ example: null })
  @Column({ name: 'org_id', type: 'uuid', nullable: true })
  orgId: string | null;
}
