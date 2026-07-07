import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { EvidenceType } from './evidence-type.enum';

@Entity({ name: 'forensic_evidence_items' })
export class ForensicEvidenceItem extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Index()
  @Column({ name: 'case_id', type: 'uuid' })
  caseId: string;

  @ApiProperty({ enum: EvidenceType })
  @Column({ name: 'item_type', type: 'enum', enum: EvidenceType })
  itemType: EvidenceType;

  @ApiProperty({ example: 'auth-service' })
  @Column({ name: 'source_system', type: 'varchar', length: 100, nullable: true })
  sourceSystem: string | null;

  @ApiProperty({ nullable: true })
  @Column({ name: 'collected_from', type: 'text', nullable: true })
  collectedFrom: string | null;

  @ApiProperty({ example: 'automatic_api_export' })
  @Column({ name: 'collection_method', type: 'varchar', length: 50, nullable: true })
  collectionMethod: string | null;

  @ApiProperty({ type: () => String })
  @Column({ name: 'collector_id', type: 'uuid' })
  collectorId: string;

  @Column({ name: 'collected_at', type: 'timestamptz', default: () => 'NOW()' })
  collectedAt: Date;

  @ApiProperty({ nullable: true })
  @Column({ name: 'file_hash_md5', type: 'char', length: 32, nullable: true })
  fileHashMd5: string | null;

  @ApiProperty({ nullable: true })
  @Column({ name: 'file_hash_sha256', type: 'char', length: 64, nullable: true })
  fileHashSha256: string | null;

  @Column({ name: 'chain_custody_record', type: 'jsonb', nullable: true })
  chainCustodyRecord: Record<string, unknown> | null;

  @Column({ name: 'verified', type: 'boolean', default: false })
  verified: boolean;

  @Column({ name: 'storage_location', type: 'text', nullable: true })
  storageLocation: string | null;

  @Column({ name: 'access_granted_to', type: 'uuid', array: true, default: '{}' })
  accessGrantedTo: string[];

  @Column({ name: 'retention_until', type: 'timestamptz', nullable: true })
  retentionUntil: Date | null;
}
