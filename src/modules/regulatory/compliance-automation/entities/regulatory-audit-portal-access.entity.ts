import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('regulatory_audit_portal_access')
export class RegulatoryAuditPortalAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  auditorName: string;

  @Column({ type: 'varchar', length: 200 })
  auditorOrg: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  engagementRef: string;

  @Column({ type: 'simple-array' })
  accessScopes: string[];

  @Column({ type: 'uuid', name: 'access_granted_by' })
  accessGrantedBy: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
