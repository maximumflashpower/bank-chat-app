import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('pep_records')
export class PepRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  @Column({ name: 'aliases', type: 'jsonb', nullable: true })
  aliases: string[];

  @Column({ name: 'country', type: 'varchar', length: 2, nullable: true })
  country: string;

  @Column({ name: 'position', type: 'varchar', length: 255, nullable: true })
  position: string;

  @Column({ name: 'category', type: 'varchar', length: 50, nullable: true })
  category: string;

  @Column({ name: 'family_members', type: 'jsonb', nullable: true })
  familyMembers: string[];

  @Column({ name: 'close_associates', type: 'jsonb', nullable: true })
  closeAssociates: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
