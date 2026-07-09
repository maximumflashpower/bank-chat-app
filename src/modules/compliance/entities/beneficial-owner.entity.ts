import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('beneficial_owners')
export class BeneficialOwner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ name: 'owner_name', type: 'varchar', length: 255 })
  ownerName: string;

  @Column({ name: 'ownership_pct', type: 'numeric', precision: 5, scale: 2, default: 0 })
  ownershipPct: number;

  @Column({ name: 'is_pep', type: 'boolean', default: false })
  isPep: boolean;

  @Column({ name: 'kyc_verified', type: 'boolean', default: false })
  kycVerified: boolean;

  @Column({ name: 'ownership_chain', type: 'jsonb', nullable: true })
  ownershipChain: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
