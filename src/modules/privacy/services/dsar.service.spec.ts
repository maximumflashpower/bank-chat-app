jest.mock('../entities/dsar-request.entity');

import { DsarService } from './dsar.service';
import { DsarStatus, DSAR_TRANSITIONS } from '../entities/dsar-status.enum';
import { DsarRequestType } from '../entities/dsar-request-type.enum';
import { DsarReceivedChannel } from '../entities/dsar-received-channel.enum';
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
    it('should create a DSAR request with channel', async () => {
      const dto = { requestType: DsarRequestType.ACCESS, receivedChannel: DsarReceivedChannel.EMAIL, notes: 'test notes' };
      const mockCreated = { id: 'dsar-1', ...dto, status: DsarStatus.RECEIVED };
      dsarRepo.create.mockReturnValue(mockCreated);
      dsarRepo.save.mockResolvedValue(mockCreated);

      const result = await service.createRequest('u1', dto);

      expect(result).toBe(mockCreated);
      expect(dsarRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'u1',
        requestType: DsarRequestType.ACCESS,
        status: DsarStatus.RECEIVED,
        receivedChannel: DsarReceivedChannel.EMAIL,
        reviewNotes: 'test notes',
      }));
    });

    it('should default channel to WEB when not provided', async () => {
      const dto = { requestType: DsarRequestType.PORTABILITY };
      const mockCreated = { id: 'dsar-1' };
      dsarRepo.create.mockReturnValue(mockCreated);
      dsarRepo.save.mockResolvedValue(mockCreated);

      await service.createRequest('u1', dto);

      expect(dsarRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        receivedChannel: DsarReceivedChannel.WEB,
        reviewNotes: null,
      }));
    });

    it('should set deadline based on request type', async () => {
      const dto = { requestType: DsarRequestType.ACCESS };
      const mockCreated = { id: 'dsar-1' };
      dsarRepo.create.mockReturnValue(mockCreated);
      dsarRepo.save.mockResolvedValue(mockCreated);

      await service.createRequest('u1', dto);

      const createCall = dsarRepo.create.mock.calls[0][0];
      expect(createCall.deadline).toBeDefined();
      expect(createCall.deadline).toBeInstanceOf(Date);
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

  describe('listUserRequests', () => {
    it('should return user requests ordered DESC', async () => {
      const mockReqs = [{ id: 'r1' }, { id: 'r2' }];
      dsarRepo.find.mockResolvedValue(mockReqs);

      const result = await service.listUserRequests('u1');
      expect(result).toBe(mockReqs);
      expect(dsarRepo.find).toHaveBeenCalledWith({ where: { userId: 'u1' }, order: { createdAt: 'DESC' } });
    });
  });

  describe('listAllRequests', () => {
    it('should return all requests without filter', async () => {
      const mockReqs = [{ id: 'r1' }];
      dsarRepo.find.mockResolvedValue(mockReqs);
      const result = await service.listAllRequests();
      expect(dsarRepo.find).toHaveBeenCalledWith({ where: {}, order: { createdAt: 'DESC' } });
    });

    it('should filter by status when provided', async () => {
      dsarRepo.find.mockResolvedValue([]);
      await service.listAllRequests(DsarStatus.READY);
      expect(dsarRepo.find).toHaveBeenCalledWith({ where: { status: DsarStatus.READY }, order: { createdAt: 'DESC' } });
    });
  });

  describe('updateStatus', () => {
    it('should update status with valid transition', async () => {
      const req = { id: 'r1', status: DsarStatus.RECEIVED, reviewNotes: null };
      dsarRepo.findOne.mockResolvedValue(req);
      dsarRepo.save.mockImplementation((e: any) => Promise.resolve(e));

      const validNext = DSAR_TRANSITIONS[DsarStatus.RECEIVED][0];
      const result = await service.updateStatus('r1', { status: validNext, reviewNotes: 'ok' });

      expect(result.status).toBe(validNext);
      expect(result.reviewNotes).toBe('ok');
    });

    it('should set completedAt when transitioning to DELIVERED', async () => {
      const req = { id: 'r1', status: DsarStatus.READY };
      dsarRepo.findOne.mockResolvedValue(req);
      dsarRepo.save.mockImplementation((e: any) => Promise.resolve(e));

      const validNext = DSAR_TRANSITIONS[DsarStatus.READY].includes(DsarStatus.DELIVERED) ? DsarStatus.DELIVERED : DSAR_TRANSITIONS[DsarStatus.READY][0];
      const result = await service.updateStatus('r1', { status: validNext });

      if (validNext === DsarStatus.DELIVERED) {
        expect(result.completedAt).toBeDefined();
      }
    });

    it('should throw BadRequestException for invalid transition', async () => {
      const req = { id: 'r1', status: DsarStatus.RECEIVED };
      dsarRepo.findOne.mockResolvedValue(req);

      await expect(service.updateStatus('r1', { status: 'INVALID_STATUS' as any }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when request not found', async () => {
      dsarRepo.findOne.mockResolvedValue(null);
      await expect(service.updateStatus('nonexistent', { status: DsarStatus.PROCESSING }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('compileDataPackage', () => {
    it('should compile and set status to READY from RECEIVED', async () => {
      const req = { id: 'r1', status: DsarStatus.RECEIVED, userId: 'u1', requestType: DsarRequestType.ACCESS };
      dsarRepo.findOne.mockResolvedValue(req);
      dsarRepo.save.mockImplementation((e: any) => Promise.resolve(e));

      const result = await service.compileDataPackage('r1');

      expect(result.status).toBe(DsarStatus.READY);
      expect(result.dataPackageUrl).toContain('privacy://dsar/');
      expect(result.dataPackageSize).toBeGreaterThan(0);
    });

    it('should compile from PROCESSING status', async () => {
      const req = { id: 'r1', status: DsarStatus.PROCESSING, userId: 'u1', requestType: DsarRequestType.ACCESS };
      dsarRepo.findOne.mockResolvedValue(req);
      dsarRepo.save.mockImplementation((e: any) => Promise.resolve(e));

      const result = await service.compileDataPackage('r1');
      expect(result.status).toBe(DsarStatus.READY);
    });

    it('should throw BadRequestException when status is not RECEIVED or PROCESSING', async () => {
      dsarRepo.findOne.mockResolvedValue({ id: 'r1', status: DsarStatus.DELIVERED });
      await expect(service.compileDataPackage('r1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when request not found', async () => {
      dsarRepo.findOne.mockResolvedValue(null);
      await expect(service.compileDataPackage('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('downloadDataPackage', () => {
    it('should return download info and mark as DELIVERED from READY', async () => {
      const req = { id: 'r1', status: DsarStatus.READY, dataPackageUrl: 'privacy://dsar/r1/data.json', dataPackageSize: 100, requestType: DsarRequestType.ACCESS };
      dsarRepo.findOne.mockResolvedValue(req);
      dsarRepo.save.mockImplementation((e: any) => Promise.resolve(e));

      const result = await service.downloadDataPackage('r1');

      expect(result.url).toBe('privacy://dsar/r1/data.json');
      expect(result.size).toBe(100);
      expect(req.status).toBe(DsarStatus.DELIVERED);
      expect(req.completedAt).toBeDefined();
    });

    it('should return download info without changing status when already DELIVERED', async () => {
      const req = { id: 'r1', status: DsarStatus.DELIVERED, dataPackageUrl: 'url', dataPackageSize: 50, requestType: DsarRequestType.ACCESS };
      dsarRepo.findOne.mockResolvedValue(req);
      dsarRepo.save.mockImplementation((e: any) => Promise.resolve(e));

      const result = await service.downloadDataPackage('r1');
      expect(result.url).toBe('url');
      expect(dsarRepo.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when not READY or DELIVERED', async () => {
      dsarRepo.findOne.mockResolvedValue({ id: 'r1', status: DsarStatus.RECEIVED, dataPackageUrl: 'url' });
      await expect(service.downloadDataPackage('r1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no dataPackageUrl', async () => {
      dsarRepo.findOne.mockResolvedValue({ id: 'r1', status: DsarStatus.READY, dataPackageUrl: null });
      await expect(service.downloadDataPackage('r1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateErasure', () => {
    it('should return validation with blockers', async () => {
      dsarRepo.count.mockResolvedValue(0);
      const result = await service.validateErasure('u1');
      expect(result).toHaveProperty('canErase');
      expect(result).toHaveProperty('blockers');
      expect(Array.isArray(result.blockers)).toBe(true);
    });
  });

  describe('executeErasure', () => {
    it('should complete erasure successfully', async () => {
      const req = { id: 'r1', userId: 'u1', requestType: DsarRequestType.ERASURE, status: DsarStatus.RECEIVED };
      dsarRepo.findOne.mockResolvedValue(req);
      dsarRepo.save.mockImplementation((e: any) => Promise.resolve(e));

      const result = await service.executeErasure('r1');

      expect(result.status).toBe(DsarStatus.READY);
      expect(result.completedAt).toBeDefined();
      expect(result.dataPackageUrl).toContain('erasure-confirmation');
    });

    it('should reject erasure when validation blocks it', async () => {
      const req = { id: 'r1', userId: 'u1', requestType: DsarRequestType.ERASURE, status: DsarStatus.RECEIVED };
      dsarRepo.findOne.mockResolvedValue(req);
      dsarRepo.save.mockImplementation((e: any) => Promise.resolve(e));
      jest.spyOn(service, 'validateErasure').mockResolvedValue({ canErase: false, blockers: ['legal hold'] });

      const result = await service.executeErasure('r1');

      expect(result.status).toBe(DsarStatus.REJECTED);
      expect(result.reviewNotes).toContain('legal hold');
    });

    it('should throw NotFoundException when erasure request not found', async () => {
      dsarRepo.findOne.mockResolvedValue(null);
      await expect(service.executeErasure('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkOverdueRequests', () => {
    it('should return overdue requests', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]),
      };
      dsarRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.checkOverdueRequests();
      expect(result).toHaveLength(2);
      expect(mockQB.where).toHaveBeenCalled();
      expect(mockQB.andWhere).toHaveBeenCalled();
    });

    it('should return empty array when no overdue', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      dsarRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.checkOverdueRequests();
      expect(result).toEqual([]);
    });
  });

  describe('exportPortabilityData', () => {
    it('should export in JSON format', async () => {
      const dto = { format: 'json', userId: 'u1' };
      const result = await service.exportPortabilityData('u1', dto);
      expect(result.format).toBe('json');
      expect(result.sizeBytes).toBeGreaterThan(0);
      expect(() => JSON.parse(result.data)).not.toThrow();
    });

    it('should export in CSV format', async () => {
      const dto = { format: 'csv', userId: 'u1' };
      const result = await service.exportPortabilityData('u1', dto);
      expect(result.format).toBe('csv');
      expect(result.data).toContain(',');
      expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it('should throw BadRequestException for unsupported format', async () => {
      const dto = { format: 'xml', userId: 'u1' };
      await expect(service.exportPortabilityData('u1', dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitRectification', () => {
    it('should create rectification request', async () => {
      const dto = { corrections: { firstName: 'Correct Name', email: 'new@email.com' } };
      const mockCreated = { id: 'r1', requestType: DsarRequestType.RECTIFICATION };
      dsarRepo.create.mockReturnValue(mockCreated);
      dsarRepo.save.mockResolvedValue(mockCreated);

      const result = await service.submitRectification('u1', dto);
      expect(result).toBe(mockCreated);
      expect(dsarRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'u1',
        requestType: DsarRequestType.RECTIFICATION,
        status: DsarStatus.RECEIVED,
      }));
    });

    it('should throw BadRequestException when corrections are empty', async () => {
      await expect(service.submitRectification('u1', { corrections: {} })).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitObjection', () => {
    it('should create objection request', async () => {
      const dto = { objectionType: 'direct_marketing', reason: 'No consent' };
      const mockCreated = { id: 'r1', requestType: DsarRequestType.OBJECTION };
      dsarRepo.create.mockReturnValue(mockCreated);
      dsarRepo.save.mockResolvedValue(mockCreated);

      const result = await service.submitObjection('u1', dto);
      expect(result).toBe(mockCreated);
      expect(dsarRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'u1',
        requestType: DsarRequestType.OBJECTION,
        status: DsarStatus.RECEIVED,
      }));
    });
  });
});
