import { Entity, Column, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { UserStatus } from './user-status.enum';
import { Credential } from './credential.entity';

@Entity({ name: 'identity_users' })
export class IdentityUser extends BaseEntity {
  @ApiProperty({ example: '+525512345678', description: 'Phone number with country code' })
  @Index({ unique: true })
  @Column({ name: 'phone_number', type: 'varchar', length: 20, unique: true })
  phoneNumber: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @Index({ unique: true })
  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @ApiProperty({ example: 'Juan', description: 'First name' })
  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName: string | null;

  @ApiProperty({ example: 'Pérez', description: 'Last name' })
  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @ApiProperty({ enum: UserStatus, example: UserStatus.PENDING })
  @Column({ name: 'status', type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @ApiProperty({ example: false })
  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @ApiProperty({ example: null })
  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty({ example: '192.168.1.1' })
  @Column({ name: 'last_login_ip', type: 'varchar', length: 45, nullable: true })
  lastLoginIp: string | null;

  @ApiProperty({ type: () => [Credential] })
  @OneToMany(() => Credential, (credential) => credential.user, { cascade: true })
  credentials: Credential[];
}
