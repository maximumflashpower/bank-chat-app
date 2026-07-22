import { NightDepositService } from './night-deposit.service';
import { NightDepositType, NightDepositStatus } from '../entities/teller-night-deposit.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('NightDepositService', () => {
  let service: NightDepositService;
  let nightDepositRepo: any;

  beforeEach(() => {
    nightDepositRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new NightDepositService(nightDepositRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // createDeposit
  // ═══════════════════════════════════════════════════
  describe('createDeposit', () => {
    const baseDto = {
      depositReference: 'NDP-001',
      branchId: 'b1',
      customerId: 'c1',
      accountId: 'a1',
      depositType: NightDepositType.CASH,
      bagIdentifier: 'BAG-001',
      statedCashAmount: 5000,
      statedCheckCount: 0,
      statedCheckTotal: 0,
    };

    it('should create a night deposit successfully', async () => {
      nightDepositRepo.findOne.mockResolvedValue(null);
      nightDepositRepo.create.mockImplementation((data: any) => ({ ...data }));
      nightDepositRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.createDeposit(baseDto as any);
      expect(result.depositReference).toBe('NDP-001');
      expect(result.depositStatus).toBe(NightDepositStatus.RECEIVED);
      expect(result.currencyCode).toBe('USD');
      expect(result.depositedAt).toBeInstanceOf(Date);
    });

    it('should use provided currencyCode when specified', async () => {
      nightDepositRepo.findOne.mockResolvedValue(null);
      nightDepositRepo.create.mockImplementation((data: any) => ({ ...data }));
      nightDepositRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.createDeposit({ ...baseDto, currencyCode: 'EUR' } as any);
      expect(result.currencyCode).toBe('EUR');
    });

    it('should throw BadRequestException when deposit already exists', async () => {
      nightDepositRepo.findOne.mockResolvedValue({ id: 'nd1', depositReference: 'NDP-001' });

      await expect(service.createDeposit(baseDto as any)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════
  // getById
  // ═══════════════════════════════════════════════════
  describe('getById', () => {
    it('should return deposit by ID', async () => {
      const mockDeposit = { id: 'nd1', depositReference: 'NDP-001' };
      nightDepositRepo.findOne.mockResolvedValue(mockDeposit);

      const result = await service.getById('nd1');
      expect(result).toBe(mockDeposit);
    });

    it('should throw NotFoundException when deposit not found', async () => {
      nightDepositRepo.findOne.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // getByReference
  // ═══════════════════════════════════════════════════
  describe('getByReference', () => {
    it('should return deposit by reference', async () => {
      const mockDeposit = { id: 'nd1', depositReference: 'NDP-001' };
      nightDepositRepo.findOne.mockResolvedValue(mockDeposit);

      const result = await service.getByReference('NDP-001');
      expect(result).toBe(mockDeposit);
    });

    it('should throw NotFoundException when reference not found', async () => {
      nightDepositRepo.findOne.mockResolvedValue(null);
      await expect(service.getByReference('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // findByCriteria
  // ═══════════════════════════════════════════════════
  describe('findByCriteria', () => {
    const setupMockQB = () => {
      const mockQB = {
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'nd1' }]),
      };
      nightDepositRepo.createQueryBuilder.mockReturnValue(mockQB);
      return mockQB;
    };

    it('should return deposits without filters', async () => {
      const mockQB = setupMockQB();
      const result = await service.findByCriteria();
      expect(result).toHaveLength(1);
      expect(mockQB.andWhere).not.toHaveBeenCalled();
    });

    it('should filter by branchId', async () => {
      const mockQB = setupMockQB();
      await service.findByCriteria('b1');
      expect(mockQB.andWhere).toHaveBeenCalledWith('nd.branchId = :branchId', { branchId: 'b1' });
    });

    it('should filter by customerId', async () => {
      const mockQB = setupMockQB();
      await service.findByCriteria(undefined, 'c1');
      expect(mockQB.andWhere).toHaveBeenCalledWith('nd.customerId = :customerId', { customerId: 'c1' });
    });

    it('should filter by status', async () => {
      const mockQB = setupMockQB();
      await service.findByCriteria(undefined, undefined, NightDepositStatus.RECEIVED);
      expect(mockQB.andWhere).toHaveBeenCalledWith('nd.depositStatus = :status', { status: NightDepositStatus.RECEIVED });
    });

    it('should filter by date range', async () => {
      const mockQB = setupMockQB();
      const from = new Date('2026-01-01');
      const to = new Date('2026-12-31');
      await service.findByCriteria(undefined, undefined, undefined, from, to);
      expect(mockQB.andWhere).toHaveBeenCalledWith('nd.depositedAt >= :fromDate', { fromDate: from });
      expect(mockQB.andWhere).toHaveBeenCalledWith('nd.depositedAt <= :toDate', { toDate: to });
    });

    it('should apply all filters simultaneously', async () => {
      const mockQB = setupMockQB();
      await service.findByCriteria('b1', 'c1', NightDepositStatus.RECEIVED,
        new Date('2026-01-01'), new Date('2026-12-31'));
      expect(mockQB.andWhere).toHaveBeenCalledTimes(5);
    });
  });

  // ═══════════════════════════════════════════════════
  // initiateOpening
  // ═══════════════════════════════════════════════════
  describe('initiateOpening', () => {
    it('should initiate opening of a received deposit', async () => {
      const mockDeposit = {
        id: 'nd1',
        depositReference: 'NDP-001',
        depositStatus: NightDepositStatus.RECEIVED,
      };
      nightDepositRepo.findOne.mockResolvedValue(mockDeposit);
      nightDepositRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.initiateOpening('nd1', 'teller-1');
      expect(result.depositStatus).toBe(NightDepositStatus.OPENED);
      expect(result.receivedByUserId).toBe('teller-1');
    });

    it('should throw BadRequestException when deposit is not in RECEIVED state', async () => {
      nightDepositRepo.findOne.mockResolvedValue({
        id: 'nd1',
        depositReference: 'NDP-001',
        depositStatus: NightDepositStatus.PROCESSED,
      });

      await expect(service.initiateOpening('nd1', 'teller-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when deposit not found', async () => {
      nightDepositRepo.findOne.mockResolvedValue(null);
      await expect(service.initiateOpening('nonexistent', 'teller-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // completeProcessing
  // ═══════════════════════════════════════════════════
  describe('completeProcessing', () => {
    it('should complete processing with zero variance (PROCESSED)', async () => {
      const mockDeposit = {
        id: 'nd1',
        depositReference: 'NDP-001',
        depositStatus: NightDepositStatus.OPENED,
        statedCashAmount: 5000,
      };
      nightDepositRepo.findOne.mockResolvedValue(mockDeposit);
      nightDepositRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.completeProcessing('nd1', {
        processedByUserId: 'teller-1',
        countedCashAmount: 5000,
      });
      expect(result.depositStatus).toBe(NightDepositStatus.PROCESSED);
      expect(result.varianceAmount).toBe(0);
      expect(result.processedAt).toBeInstanceOf(Date);
      expect(result.processedByUserId).toBe('teller-1');
    });

    it('should detect positive variance and mark as DISCREPANCY', async () => {
      const mockDeposit = {
        id: 'nd1',
        depositReference: 'NDP-001',
        depositStatus: NightDepositStatus.OPENED,
        statedCashAmount: 5000,
      };
      nightDepositRepo.findOne.mockResolvedValue(mockDeposit);
      nightDepositRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.completeProcessing('nd1', {
        processedByUserId: 'teller-1',
        countedCashAmount: 5100,
      });
      expect(result.depositStatus).toBe(NightDepositStatus.DISCREPANCY);
      expect(result.varianceAmount).toBe(100);
    });

    it('should detect negative variance and mark as DISCREPANCY', async () => {
      const mockDeposit = {
        id: 'nd1',
        depositReference: 'NDP-001',
        depositStatus: NightDepositStatus.OPENED,
        statedCashAmount: 5000,
      };
      nightDepositRepo.findOne.mockResolvedValue(mockDeposit);
      nightDepositRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.completeProcessing('nd1', {
        processedByUserId: 'teller-1',
        countedCashAmount: 4900,
      });
      expect(result.depositStatus).toBe(NightDepositStatus.DISCREPANCY);
      expect(result.varianceAmount).toBe(-100);
    });

    it('should allow small variance within $1.00 threshold', async () => {
      const mockDeposit = {
        id: 'nd1',
        depositReference: 'NDP-001',
        depositStatus: NightDepositStatus.OPENED,
        statedCashAmount: 5000,
      };
      nightDepositRepo.findOne.mockResolvedValue(mockDeposit);
      nightDepositRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.completeProcessing('nd1', {
        processedByUserId: 'teller-1',
        countedCashAmount: 5000.50,
      });
      expect(result.depositStatus).toBe(NightDepositStatus.PROCESSED);
      expect(result.varianceAmount).toBe(0.50);
    });

    it('should set ledgerJournalEntryId when provided', async () => {
      const mockDeposit = {
        id: 'nd1',
        depositReference: 'NDP-001',
        depositStatus: NightDepositStatus.OPENED,
        statedCashAmount: 5000,
      };
      nightDepositRepo.findOne.mockResolvedValue(mockDeposit);
      nightDepositRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.completeProcessing('nd1', {
        processedByUserId: 'teller-1',
        countedCashAmount: 5000,
        ledgerJournalEntryId: 'je-1',
      });
      expect(result.ledgerJournalEntryId).toBe('je-1');
    });

    it('should throw BadRequestException when deposit is not OPENED', async () => {
      nightDepositRepo.findOne.mockResolvedValue({
        id: 'nd1',
        depositReference: 'NDP-001',
        depositStatus: NightDepositStatus.RECEIVED,
      });

      await expect(
        service.completeProcessing('nd1', { processedByUserId: 'teller-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════
  // rejectDeposit
  // ═══════════════════════════════════════════════════
  describe('rejectDeposit', () => {
    it('should reject a deposit', async () => {
      const mockDeposit = {
        id: 'nd1',
        depositReference: 'NDP-001',
        depositStatus: NightDepositStatus.RECEIVED,
      };
      nightDepositRepo.findOne.mockResolvedValue(mockDeposit);
      nightDepositRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.rejectDeposit('nd1', 'Damaged bag', 'manager-1');
      expect(result.depositStatus).toBe(NightDepositStatus.REJECTED);
      expect(result.discrepancyNotes).toBe('Damaged bag');
      expect(result.processedByUserId).toBe('manager-1');
    });

    it('should throw BadRequestException when deposit already PROCESSED', async () => {
      nightDepositRepo.findOne.mockResolvedValue({
        id: 'nd1',
        depositReference: 'NDP-001',
        depositStatus: NightDepositStatus.PROCESSED,
      });

      await expect(
        service.rejectDeposit('nd1', 'reason', 'manager-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when deposit not found', async () => {
      nightDepositRepo.findOne.mockResolvedValue(null);
      await expect(
        service.rejectDeposit('nonexistent', 'reason', 'manager-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // recordDiscrepancyResolution
  // ═══════════════════════════════════════════════════
  describe('recordDiscrepancyResolution', () => {
    it('should resolve a discrepancy and mark as PROCESSED', async () => {
      const mockDeposit = {
        id: 'nd1',
        depositReference: 'NDP-001',
        depositStatus: NightDepositStatus.DISCREPANCY,
        discrepancyNotes: 'Varianza de $100.00',
      };
      nightDepositRepo.findOne.mockResolvedValue(mockDeposit);
      nightDepositRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.recordDiscrepancyResolution('nd1', 'Missing bills found', 'manager-1');
      expect(result.depositStatus).toBe(NightDepositStatus.PROCESSED);
      expect(result.discrepancyNotes).toContain('Missing bills found');
      expect(result.processedByUserId).toBe('manager-1');
    });

    it('should throw BadRequestException when deposit is not in DISCREPANCY state', async () => {
      nightDepositRepo.findOne.mockResolvedValue({
        id: 'nd1',
        depositReference: 'NDP-001',
        depositStatus: NightDepositStatus.PROCESSED,
      });

      await expect(
        service.recordDiscrepancyResolution('nd1', 'resolution', 'manager-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when deposit not found', async () => {
      nightDepositRepo.findOne.mockResolvedValue(null);
      await expect(
        service.recordDiscrepancyResolution('nonexistent', 'resolution', 'manager-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
