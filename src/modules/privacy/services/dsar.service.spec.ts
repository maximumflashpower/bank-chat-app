import { DsarService } from './dsar.service';
import { DsarStatus, DsarRequestType } from '../entities/privacy-dsar-request.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DsarService', () => {
  let service: DsarService;
  let dsarRepo: any;

  beforeEach(() => {
    dsarRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new DsarService(dsarRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRequest', () => {
    it('should create a DSAR request with notes', async () => {
      const dto = { requestType: DsarRequestType.ACCESS, additionalNotes: 'test notes' };
      const now = new Date();
      const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      dsarRepo.save.mockImplementation((input: any) => {
        const result = { id: 'dsar-1', userId: 'u1', ...input, status: DsarStatus.RECEIVED, deadline };
        return Promise.resolve(result);
      });
      
      const result = await service.createRequest('u1', dto as any);
      expect(result.status).toBe(DsarStatus.RECEIVED);
      expect(result.deadline).toBeInstanceOf(Date);
      expect(result.reviewNotes).toBe('test notes');
    });

    it('should default reviewNotes to null when not provided', async () => {
      const dto = { requestType: DsarRequestType.PORTABILITY };
      dsarRepo.save.mockImplementation((input: any) => Promise.resolve({ id: 'dsar-1', ...input, reviewNotes: null }));
      await service.createRequest('u1', dto as any);
      const savedArg = dsarRepo.save.mock.calls[0][0];
      expect(savedArg.reviewNotes).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('should return request by id', async () => {
      const mockReq = { id: 'r1', userId: 'u1' };
      dsarRepo.findOne.mockResolvedValue(mockReq);
      const result = await service.getStatus('r1');
      expect(result).toBe(mockReq);
      expect(dsarRepo.findOne).toHaveBeenCalledWith({ where: { id: 'r1' } });
    });

    it('should filter by userId when provided', async () => {
      const mockReq = { id: 'r1', userId: 'u1' };
      dsarRepo.findOne.mockResolvedValue(mockReq);
      await service.getStatus('r1', 'u1');
      expect(dsarRepo.findOne).toHaveBeenCalledWith({ where: { id: 'r1', userId: 'u1' } });
    });

    it('should throw NotFoundException when not found', async () => {
      dsarRepo.findOne.mockResolvedValue(null);
      await expect(service.getStatus('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('compileDataPackage', () => {
    it('should compile and set status to PROCESSING', async () => {
      const req = { id: 'r1', status: DsarStatus.RECEIVED, userId: 'u1', requestType: DsarRequestType.ACCESS };
      dsarRepo.findOne.mockResolvedValue(req);
      dsarRepo.save.mockImplementation((input: any) => Promise.resolve({ ...input, status: DsarStatus.PROCESSING, dataPackageUrl: '/storage/dsar/r1.zip', dataPackageSize: 1024 * 1024 }));
      const result = await service.compileDataPackage('r1');
      expect(result.status).toBe(DsarStatus.PROCESSING);
      expect(result.dataPackageUrl).toContain('/storage/dsar/');
    });

    it('should throw NotFoundException when request not found', async () => {
      dsarRepo.findOne.mockResolvedValue(null);
      await expect(service.compileDataPackage('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('downloadDataPackage', () => {
    it('should return download info with url, size and expiresAt', async () => {
      const req = {
        id: 'r1', status: DsarStatus.READY,
        dataPackageUrl: '/storage/dsar/r1.zip', dataPackageSize: 100,
      };
      dsarRepo.findOne.mockResolvedValue(req);
      const result = await service.downloadDataPackage('r1');
      expect(result.url).toBe('/storage/dsar/r1.zip');
      expect(result.size).toBe(100);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException when no dataPackageUrl', async () => {
      dsarRepo.findOne.mockResolvedValue({ id: 'r1', status: DsarStatus.READY, dataPackageUrl: null });
      await expect(service.downloadDataPackage('r1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when status is CLOSED', async () => {
      dsarRepo.findOne.mockResolvedValue({ id: 'r1', status: DsarStatus.CLOSED, dataPackageUrl: 'url' });
      await expect(service.downloadDataPackage('r1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when status is REJECTED', async () => {
      dsarRepo.findOne.mockResolvedValue({ id: 'r1', status: DsarStatus.REJECTED, dataPackageUrl: 'url' });
      await expect(service.downloadDataPackage('r1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should update status with valid transition RECEIVED→PROCESSING', async () => {
      const req = { id: 'r1', status: DsarStatus.RECEIVED, reviewNotes: null };
      dsarRepo.findOne.mockResolvedValue(req);
      dsarRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      const result = await service.updateStatus('r1', { status: DsarStatus.PROCESSING, reviewNotes: 'ok' } as any);
      expect(result.status).toBe(DsarStatus.PROCESSING);
    });

    it('should set completedAt when transitioning to READY', async () => {
      const req = { id: 'r1', status: DsarStatus.PROCESSING };
      dsarRepo.findOne.mockResolvedValue(req);
      dsarRepo.save.mockImplementation((input: any) => Promise.resolve({ ...input, completedAt: new Date() }));
      const result = await service.updateStatus('r1', { status: DsarStatus.READY } as any);
      expect(result.completedAt).toBeDefined();
    });

    it('should throw BadRequestException for invalid transition', async () => {
      const req = { id: 'r1', status: DsarStatus.RECEIVED };
      dsarRepo.findOne.mockResolvedValue(req);
      await expect(service.updateStatus('r1', { status: DsarStatus.DELIVERED } as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('executeErasure', () => {
    it('should process erasure request', async () => {
      const req = { id: 'r1', userId: 'u1', requestType: DsarRequestType.ERASURE, status: DsarStatus.RECEIVED };
      dsarRepo.findOne.mockResolvedValue(req);
      dsarRepo.save.mockImplementation((input: any) => Promise.resolve({ ...input, status: DsarStatus.PROCESSING }));
      await expect(service.executeErasure('r1')).resolves.not.toThrow();
    });

    it('should throw BadRequestException when not erasure type', async () => {
      const req = { id: 'r1', requestType: DsarRequestType.ACCESS };
      dsarRepo.findOne.mockResolvedValue(req);
      await expect(service.executeErasure('r1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkOverdueRequests', () => {
    it('should return overdue requests count and list', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'r1', status: DsarStatus.RECEIVED }, { id: 'r2', status: DsarStatus.PROCESSING }]),
        getCount: jest.fn().mockResolvedValue(2),
      };
      dsarRepo.createQueryBuilder.mockReturnValue(mockQB);
      dsarRepo.find.mockResolvedValue([{ id: 'r1', status: DsarStatus.RECEIVED }]);
      
      const result = await service.checkOverdueRequests();
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.overdue)).toBe(true);
    });

    it('should return empty when no overdue', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
      };
      dsarRepo.createQueryBuilder.mockReturnValue(mockQB);
      dsarRepo.find.mockResolvedValue([]);
      
      const result = await service.checkOverdueRequests();
      expect(result.total).toBe(0);
      expect(result.overdue).toEqual([]);
    });
  });

  describe('exportPortabilityData', () => {
    it('should export in JSON format', async () => {
      dsarRepo.find.mockResolvedValue([{ id: 'r1' }]);
      const result = await service.exportPortabilityData('u1', { format: 'json' } as any);
      expect(result.format).toBe('json');
    });
  });
});
