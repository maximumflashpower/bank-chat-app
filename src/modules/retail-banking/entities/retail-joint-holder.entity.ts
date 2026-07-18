import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum RelationshipType {
  JOINT = 'joint',
  AUTHORIZED_USER = 'authorized_user',
  BENEFICIARY = 'beneficiary',
  POWER_OF_ATTORNEY = 'power_attorney',
}

export enum AccessLevel {
  FULL_ACCESS = 'full_access',
  VIEW_ONLY = 'view_only',
  TRANSACT_ONLY = 'transact_only',
}

export enum JointHolderStatus {
  ACTIVE = 'active',
  REMOVED = 'removed',
  PENDING = 'pending',
}

@Entity('retail_joint_holder')
export class RetailJointHolder extends BaseEntity {
  @Column({ name: 'account_id', type: 'uuid', nullable: false })
  accountId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ name: 'relationship_type', type: 'varchar', length: 20, nullable: false })
  relationshipType: RelationshipType;

  @Column({ name: 'ownership_percentage', type: 'numeric', precision: 5, scale: 2, default: 100 })
  ownershipPercentage: number;

  @Column({ name: 'access_level', type: 'varchar', length: 20, nullable: false })
  accessLevel: AccessLevel;

  @Column({ name: 'added_by', type: 'uuid', nullable: true })
  addedBy: string | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'added_at', type: 'timestamptz', nullable: true })
  addedAt: Date | null;

  @Column({ name: 'removed_at', type: 'timestamptz', nullable: true })
  removedAt: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: JointHolderStatus;
}
