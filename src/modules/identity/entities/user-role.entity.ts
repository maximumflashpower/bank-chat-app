import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from './identity-user.entity';
import { Role } from './role.entity';

@Entity({ name: 'identity_user_roles' })
@Index(['userId', 'roleId'], { unique: true })
export class UserRole extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ type: () => String })
  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ApiPropertyOptional({ example: null })
  @Column({ name: 'org_id', type: 'uuid', nullable: true })
  orgId: string | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // ── Relations ──
  @ApiProperty({ type: () => IdentityUser })
  @ManyToOne(() => IdentityUser, (user) => user.userRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;

  @ApiProperty({ type: () => Role })
  @ManyToOne(() => Role, (role) => role.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
