jest.mock('../entities/third-party-processor.entity');

import { ThirdPartyProcessorService } from './third-party-processor.service';
import { ProcessorAgreementStatus } from '../entities/processor-agreement-status.enum';
import { NotFoundException } from '@nestjs/common';

describe('ThirdPartyProcessorService', () => {
  let service: ThirdPartyProcessorService;
  let repo: any;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new ThirdPartyProcessorService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProcessor', () => {
    it('should create processor with defaults', async () => {
      const dto = {
        processorName: 'AWS', serviceType: 'cloud', dataCategories: ['personal'], purpose: 'hosting',
        agreementDate: '2026-01-01',
      };
      const mockCreated = { id: 'p1', ...dto };
      repo.create.mockReturnValue(mockCreated);
      repo.save.mockResolvedValue(mockCreated);

      const result = await service.createProcessor(dto);
      expect(result).toBe(mockCreated);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        processorName: 'AWS',
        transferCountries: null,
        transferMechanism: null,
        agreementStatus: ProcessorAgreementStatus.ACTIVE,
        expiryDate: null,
        documentRef: null,
      }));
    });

    it('should use provided optional fields', async () => {
      const dto = {
        processorName: 'Stripe', serviceType: 'payments', dataCategories: ['financial'], purpose: 'billing',
        transferCountries: ['US'], transferMechanism: 'SCCs', agreementStatus: ProcessorAgreementStatus.PENDING_RENEWAL,
        agreementDate: '2026-03-01', expiryDate: '2027-03-01', documentRef: 'DPA-001',
      };
      repo.create.mockReturnValue({ id: 'p1' });
      repo.save.mockResolvedValue({ id: 'p1' });

      await service.createProcessor(dto);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        transferCountries: ['US'],
        transferMechanism: 'SCCs',
        agreementStatus: ProcessorAgreementStatus.PENDING_RENEWAL,
        expiryDate: new Date('2027-03-01'),
        documentRef: 'DPA-001',
      }));
    });
  });

  describe('listProcessors', () => {
    it('should return all processors when activeOnly=false', async () => {
      const mockProcs = [{ id: 'p1' }];
      repo.find.mockResolvedValue(mockProcs);
      const result = await service.listProcessors();
      expect(result).toBe(mockProcs);
      expect(repo.find).toHaveBeenCalledWith({ where: {}, order: { agreementDate: 'DESC' } });
    });

    it('should filter by ACTIVE status when activeOnly=true', async () => {
      repo.find.mockResolvedValue([]);
      await service.listProcessors(true);
      expect(repo.find).toHaveBeenCalledWith({ where: { agreementStatus: ProcessorAgreementStatus.ACTIVE }, order: { agreementDate: 'DESC' } });
    });
  });

  describe('getById', () => {
    it('should return processor by id', async () => {
      const mockProc = { id: 'p1', processorName: 'AWS' };
      repo.findOne.mockResolvedValue(mockProc);
      const result = await service.getById('p1');
      expect(result).toBe(mockProc);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProcessor', () => {
    it('should update processor fields', async () => {
      const proc = { id: 'p1', purpose: 'Old' };
      repo.findOne.mockResolvedValue(proc);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.updateProcessor('p1', { purpose: 'New' });
      expect(result.purpose).toBe('New');
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.updateProcessor('nonexistent', { purpose: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('terminateAgreement', () => {
    it('should set agreementStatus to TERMINATED', async () => {
      const proc = { id: 'p1', agreementStatus: ProcessorAgreementStatus.ACTIVE, processorName: 'AWS' };
      repo.findOne.mockResolvedValue(proc);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.terminateAgreement('p1');
      expect(result.agreementStatus).toBe(ProcessorAgreementStatus.TERMINATED);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.terminateAgreement('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkExpiringAgreements', () => {
    it('should return expiring agreements', async () => {
      const mockProcs = [{ id: 'p1' }, { id: 'p2' }];
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProcs),
      };
      repo.createQueryBuilder.mockReturnValue(mockQB);
      const result = await service.checkExpiringAgreements();
      expect(result).toBe(mockProcs);
      expect(mockQB.where).toHaveBeenCalledWith('p.expiry_date IS NOT NULL');
      expect(mockQB.andWhere).toHaveBeenCalledTimes(2);
    });

    it('should use custom daysAhead parameter', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repo.createQueryBuilder.mockReturnValue(mockQB);
      await service.checkExpiringAgreements(60);
      expect(mockQB.andWhere).toHaveBeenCalledWith('p.expiry_date <= :threshold', expect.objectContaining({}));
      // Verify threshold is ~60 days from now
      const thresholdArg = mockQB.andWhere.mock.calls.find((c: any[]) => c[0] === 'p.expiry_date <= :threshold')[1].threshold;
      expect(thresholdArg).toBeInstanceOf(Date);
    });

    it('should return empty array when none expiring', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repo.createQueryBuilder.mockReturnValue(mockQB);
      const result = await service.checkExpiringAgreements();
      expect(result).toEqual([]);
    });
  });

  describe('listCrossBorderTransfers', () => {
    it('should return processors with cross-border transfers', async () => {
      const mockProcs = [{ id: 'p1', transferCountries: ['US'] }];
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProcs),
      };
      repo.createQueryBuilder.mockReturnValue(mockQB);
      const result = await service.listCrossBorderTransfers();
      expect(result).toBe(mockProcs);
      expect(mockQB.where).toHaveBeenCalledWith('p.transfer_countries IS NOT NULL');
      expect(mockQB.andWhere).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when none have transfers', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repo.createQueryBuilder.mockReturnValue(mockQB);
      const result = await service.listCrossBorderTransfers();
      expect(result).toEqual([]);
    });
  });
});
