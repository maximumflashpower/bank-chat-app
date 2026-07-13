import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { IdentityUser } from './identity-user.entity';

@Entity('identity_did')
export class IdentityDid extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @ManyToOne(() => IdentityUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: IdentityUser;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  didDocumentId: string; // e.g., 'did:web:blockchain.xyz:alice'

  @Column({ type: 'text' })
  publicKeyJwk: string; // JSON stringify

  @Column({ type: 'varchar', length: 50 })
  keyType: string; // e.g., 'ed25519', 'secp256k1', 'P-256'

  @Column({ type: 'varchar', length: 100 })
  method: string; // e.g., 'web', 'ion', 'elem', 'key'

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'text', nullable: true })
  didDocumentJson: string; // Completa DID Document

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string; // active/inactive/revoked
}
