import { StorageService } from './storage.service';
import { Repository } from 'typeorm';
import { StoredFile } from '../entities/stored-file.entity';
import { tmpdir } from 'os';
import { join } from 'path';

describe('StorageService', () => {
  let service: any;
  let mockRepo: Partial<Repository<StoredFile>>;
  let mockConfigService: any;
  const tempUploadDir = join(tmpdir(), 'test-uploads-' + Date.now());

  const now = new Date(2026, 6, 10, 12, 0, 0);

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      softRemove: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'UPLOAD_DIR') return tempUploadDir;
        if (key === 'MAX_FILE_SIZE_BYTES') return 10485760;
        return null;
      }),
    };

    service = new StorageService(mockRepo as any, mockConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('upload (STORAGE-001)', () => {
    it('debe guardar referencia del archivo en BD', async () => {
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test file content'),
      };

      const saved: any = {
        id: 'file-001',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        userId: 'user-001',
        storagePath: `${tempUploadDir}/file-001.pdf`,
        createdAt: now,
      };

      (mockRepo.create as jest.Mock).mockImplementation((data) => ({ ...data, ...saved }));
      (mockRepo.save as jest.Mock).mockImplementation(async (entity) => ({
        ...entity,
        ...saved,
      }));

      const result = await service.upload('user-001', mockFile as any);

      expect(result.id).toBe('file-001');
    });
  });

  describe('getById (STORAGE-002)', () => {
    it('debe retornar archivo por ID si existe y pertenece al usuario', async () => {
      const file: any = {
        id: 'file-001',
        originalName: 'report.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        userId: 'user-001',
        storagePath: `${tempUploadDir}/file-001.pdf`,
      };

      (mockRepo.findOne as jest.Mock).mockResolvedValue(file);

      const result = await service.getById('user-001', 'file-001');

      expect(result.id).toBe('file-001');
    });

    it('debe lanzar NotFoundException si archivo no existe', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getById('user-001', 'file-missing'))
        .rejects.toThrow('File not found');
    });

    it('debe lanzar NotFoundException si archivo no pertenece al usuario', async () => {
      const file: any = { id: 'file-other', userId: 'user-002' };
      (mockRepo.findOne as jest.Mock).mockResolvedValue(file);

      await expect(service.getById('user-001', 'file-other'))
        .rejects.toThrow('File not found');
    });
  });

  describe('getFileInfo (STORAGE-003)', () => {
    it('debe retornar metadata para archivo válido', async () => {
      const file: any = {
        id: 'file-info',
        originalName: 'manual.pdf',
        mimeType: 'application/pdf',
        size: 4096,
        userId: 'user-001',
      };

      (mockRepo.findOne as jest.Mock).mockResolvedValue(file);

      const result = await service.getFileInfo('user-001', 'file-info');

      expect(result.originalName).toBe('manual.pdf');
      expect(result.mimeType).toBe('application/pdf');
    });

    it('debe lanzar NotFoundException si archivo no existe', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getFileInfo('user-001', 'file-missing'))
        .rejects.toThrow('File not found');
    });
  });

  describe('delete (STORAGE-004)', () => {
    it('debe marcar archivo como eliminado', async () => {
      const file: any = {
        id: 'file-delete',
        originalName: 'temp.txt',
        userId: 'user-001',
        filePath: 'file-delete.txt',
      };

      (mockRepo.findOne as jest.Mock).mockResolvedValue(file);
      (mockRepo.save as jest.Mock).mockResolvedValue(file);
      (mockRepo.softRemove as jest.Mock).mockResolvedValue(file);

      const result = await service.delete('user-001', 'file-delete');

      expect(result.deleted).toBe(true);
    });

    it('debe lanzar error si archivo no pertenece al usuario', async () => {
      const file: any = { id: 'file-other', userId: 'user-002' };
      (mockRepo.findOne as jest.Mock).mockResolvedValue(file);

      await expect(service.delete('user-001', 'file-other'))
        .rejects.toThrow('File not found');
    });

    it('debe lanzar error si archivo no existe', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.delete('user-001', 'file-notfound'))
        .rejects.toThrow('File not found');
    });
  });

  describe('listByUser (STORAGE-005)', () => {
    it('debe listar archivos del usuario', async () => {
      const files: any[] = [
        { id: 'f1', originalName: 'doc1.pdf', userId: 'user-001' },
        { id: 'f2', originalName: 'doc2.pdf', userId: 'user-001' },
      ];

      (mockRepo.find as jest.Mock).mockResolvedValue(files);

      const result = await service.listByUser('user-001');

      expect(result.length).toBe(2);
    });

    it('debe respetar el límite de resultados', async () => {
      const files: any[] = [
        { id: 'f1', originalName: 'doc1.pdf', userId: 'user-001' },
        { id: 'f2', originalName: 'doc2.pdf', userId: 'user-001' },
      ];

      (mockRepo.find as jest.Mock).mockResolvedValue(files);

      await service.listByUser('user-001', 2);

      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-001' },
        take: 2,
      }));
    });

    it('debe retornar array vacío si no hay archivos', async () => {
      (mockRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.listByUser('user-empty');

      expect(result).toEqual([]);
    });
  });
});
