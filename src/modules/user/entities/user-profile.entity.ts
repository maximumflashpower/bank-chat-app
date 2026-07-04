import { Entity, Column, Index, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';

@Entity({ name: 'user_profiles' })
export class UserProfile extends BaseEntity {
  @ApiProperty({ type: String, description: 'FK to identity_users' })
  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'Juan' })
  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName: string | null;

  @ApiProperty({ example: 'Pérez' })
  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @ApiProperty({ example: '1990-05-15' })
  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date | null;

  @ApiProperty({ example: 'male' })
  @Column({ name: 'gender', type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  @ApiProperty({ example: 'CDMX' })
  @Column({ name: 'city', type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @ApiProperty({ example: 'Mexico' })
  @Column({ name: 'country', type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @ApiProperty({ example: 'https://avatar.url/photo.jpg' })
  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: 'Software developer' })
  @Column({ name: 'bio', type: 'text', nullable: true })
  bio: string | null;

  @OneToOne(() => IdentityUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;
}
