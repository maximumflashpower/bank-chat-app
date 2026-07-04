import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { StorageTier } from './storage-tier.enum';
import { FileStatus } from './file-status.enum';

@Entity({ name: 'stored_files' })
export class StoredFile extends BaseEntity {
  @ApiProperty({ type: String, description: 'Owner user UUID' })
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'photo.jpg' })
  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-...', description: 'Generated unique filename' })
  @Column({ name: 'stored_name', type: 'varchar', length: 255 })
  storedName: string;

  @ApiProperty({ example: 'image/jpeg' })
  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @ApiProperty({ example: 2048576 })
  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes: number;

  @ApiProperty({ example: '/uploads/2026/07/a1b2c3d4.jpg' })
  @Column({ name: 'file_path', type: 'varchar', length: 500 })
  filePath: string;

  @ApiProperty({ example: 'a1b2c3d4', description: 'Short hash for quick lookup' })
  @Index()
  @Column({ name: 'file_hash', type: 'varchar', length: 64, nullable: true })
  fileHash: string | null;

  @ApiProperty({ enum: StorageTier, example: StorageTier.LOCAL })
  @Column({ name: 'storage_tier', type: 'enum', enum: StorageTier, default: StorageTier.LOCAL })
  storageTier: StorageTier;

  @ApiProperty({ enum: FileStatus, example: FileStatus.READY })
  @Column({ name: 'status', type: 'enum', enum: FileStatus, default: FileStatus.UPLOADING })
  status: FileStatus;

  @ApiProperty({ example: '{"width":1920,"height":1080}', description: 'Extracted metadata', required: false })
  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}
