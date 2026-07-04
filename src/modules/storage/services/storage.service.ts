import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, statSync } from 'fs';
import { join, extname } from 'path';
import { StoredFile } from '../entities/stored-file.entity';
import { StorageTier } from '../entities/storage-tier.enum';
import { FileStatus } from '../entities/file-status.enum';
import { FileUploadResponse } from '../dto/file-response.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(StoredFile)
    private fileRepo: Repository<StoredFile>,
    private config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>(
      'UPLOAD_DIR',
      join(process.cwd(), 'uploads'),
    );
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    userId: string,
    file: Express.Multer.File,
  ): Promise<FileUploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const maxBytes = this.config.get<number>(
      'MAX_FILE_SIZE_BYTES',
      10 * 1024 * 1024,
    );
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `File exceeds maximum size of ${maxBytes} bytes`,
      );
    }

    const ext = extname(file.originalname) || '';
    const storedName = `${randomUUID()}${ext}`;
    const yearMonth = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const dirPath = join(this.uploadDir, yearMonth);

    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }

    const filePath = join(dirPath, storedName);
    writeFileSync(filePath, file.buffer);

    const fileHash = createHash('sha256')
      .update(file.buffer)
      .digest('hex')
      .slice(0, 64);

    const stored = this.fileRepo.create({
      userId,
      originalName: file.originalname,
      storedName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      filePath: `/${yearMonth}/${storedName}`,
      fileHash,
      storageTier: StorageTier.LOCAL,
      status: FileStatus.READY,
      metadata: null,
    });
    await this.fileRepo.save(stored);

    this.logger.log(
      `File uploaded: ${stored.id} — name: ${file.originalname} — size: ${file.size}`,
    );

    return {
      id: stored.id,
      originalName: stored.originalName,
      mimeType: stored.mimeType,
      sizeBytes: Number(stored.sizeBytes),
      url: `/api/storage/files/${stored.id}`,
      status: stored.status,
    };
  }

  async getById(userId: string, fileId: string): Promise<StoredFile> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException('File not found');
    }
    if (file.userId !== userId) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  async getFileInfo(userId: string, fileId: string): Promise<StoredFile> {
    return this.getById(userId, fileId);
  }

  getPhysicalPath(storedFile: StoredFile): string {
    return join(this.uploadDir, storedFile.filePath);
  }

  async delete(userId: string, fileId: string): Promise<{ deleted: boolean }> {
    const file = await this.getById(userId, fileId);

    const physicalPath = this.getPhysicalPath(file);
    if (existsSync(physicalPath)) {
      unlinkSync(physicalPath);
    }

    file.status = FileStatus.DELETED;
    await this.fileRepo.save(file);
    await this.fileRepo.softRemove(file);

    this.logger.log(`File deleted: ${fileId} — name: ${file.originalName}`);
    return { deleted: true };
  }

  async listByUser(userId: string, limit = 50): Promise<StoredFile[]> {
    return this.fileRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
