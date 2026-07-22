import { TellerService } from './teller.service';
import { TellerTransactionType, TellerTransactionStatus } from '../entities/teller-transaction.entity';
import { DrawerShiftStatus } from '../entities/teller-cash-drawer.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TellerService', () => {
  let service: TellerService;
  let transactionRepo: any;
  let drawerRepo: any;

  beforeEach(() => {
    transactionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    drawerRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };
    service = new TellerService(transactionRepo, drawerRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeTransaction', () => {
    const baseDto = {
      transactionType: TellerTransactionType.DEPOSIT_CASH,
      amountPrincipal: 5000,
      branchId: 'b1',
      tellerUserId: 't1',
      customerId: 'c1',
    };
    const mockDrawer = {
      id: 'd1',
      branchId: 'b1',
      shiftStatus: DrawerShiftStatus.OPEN,
      maxCashLimit: 100000,
      totalTransactionsCount: 10,
    };

    it('should execute deposit transaction successfully', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      transactionRepo.create.mockImplementation((data: any) => ({ ...data }));
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      drawerRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.executeTransaction(baseDto as any);
      expect(result.transactionStatus).toBe(TellerTransactionStatus.PENDING);
      expect(transactionRepo.save).toHaveBeenCalled();
    });

    it('should include fee in totalAmount when provided', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      transactionRepo.create.mockImplementation((data: any) => ({ ...data }));
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      drawerRepo.save.mockResolvedValue({});

      await service.executeTransaction({ ...baseDto, feeCharged: 25 } as any);
      const savedArg = transactionRepo.save.mock.calls[0][0];
      expect(savedArg.totalAmount).toBe(5025);
      expect(savedArg.feeCharged).toBe(25);
    });

    it('should set FX rate when provided', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      transactionRepo.create.mockImplementation((data: any) => ({ ...data }));
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      drawerRepo.save.mockResolvedValue({});

      await service.executeTransaction({ ...baseDto, foreignExchangeRate: 1.25 } as any);
      const savedArg = transactionRepo.save.mock.calls[0][0];
      expect(savedArg.foreignExchangeRate).toBe(1.25);
    });

    it('should not require override for deposits regardless of amount', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      transactionRepo.create.mockImplementation((data: any) => ({ ...data }));
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      drawerRepo.save.mockResolvedValue({});

      await service.executeTransaction({
        transactionType: TellerTransactionType.DEPOSIT_CASH,
        amountPrincipal: 100000,
        branchId: 'b1',
        tellerUserId: 't1',
        customerId: 'c1',
      } as any);
      const savedArg = transactionRepo.save.mock.calls[0][0];
      expect(savedArg.overrideRequired).toBe(false);
    });

    it('should not require override for withdrawal under $10,000', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      transactionRepo.create.mockImplementation((data: any) => ({ ...data }));
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      drawerRepo.save.mockResolvedValue({});

      await service.executeTransaction({
        transactionType: TellerTransactionType.WITHDRAWAL_CASH,
        amountPrincipal: 9000,
        branchId: 'b1',
        tellerUserId: 't1',
        customerId: 'c1',
      } as any);
      const savedArg = transactionRepo.save.mock.calls[0][0];
      expect(savedArg.overrideRequired).toBe(false);
    });

    it('should not require override for transfer under $50,000', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      transactionRepo.create.mockImplementation((data: any) => ({ ...data }));
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      drawerRepo.save.mockResolvedValue({});

      await service.executeTransaction({
        transactionType: TellerTransactionType.TRANSFER_INTERNAL,
        amountPrincipal: 45000,
        branchId: 'b1',
        tellerUserId: 't1',
        customerId: 'c1',
      } as any);
      const savedArg = transactionRepo.save.mock.calls[0][0];
      expect(savedArg.overrideRequired).toBe(false);
    });

    it('should throw BadRequestException when no drawer is open', async () => {
      drawerRepo.findOne.mockResolvedValue(null);
      await expect(service.executeTransaction(baseDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when withdrawal exceeds $10,000 limit', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      await expect(
        service.executeTransaction({
          ...baseDto,
          transactionType: TellerTransactionType.WITHDRAWAL_CASH,
          amountPrincipal: 15000,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when internal transfer exceeds $50,000', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      await expect(
        service.executeTransaction({
          ...baseDto,
          transactionType: TellerTransactionType.TRANSFER_INTERNAL,
          amountPrincipal: 60000,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when FX exceeds $25,000', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      await expect(
        service.executeTransaction({
          ...baseDto,
          transactionType: TellerTransactionType.FOREIGN_EXCHANGE,
          amountPrincipal: 30000,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should increment drawer totalTransactionsCount', async () => {
      const drawerCopy = { ...mockDrawer };
      drawerRepo.findOne.mockResolvedValue(drawerCopy);
      transactionRepo.create.mockImplementation((data: any) => ({ ...data }));
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      drawerRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.executeTransaction(baseDto as any);
      expect(drawerCopy.totalTransactionsCount).toBe(11);
    });
  });

  describe('getByReference', () => {
    it('should return transaction by reference', async () => {
      const mockTx = { id: 'tx1', transactionReference: 'TX-202607-0001' };
      transactionRepo.findOne.mockResolvedValue(mockTx);
      const result = await service.getByReference('TX-202607-0001');
      expect(result).toBe(mockTx);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      transactionRepo.findOne.mockResolvedValue(null);
      await expect(service.getByReference('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCriteria', () => {
    const setupMockQB = () => {
      const mockQB = {
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'tx1' }]),
      };
      transactionRepo.createQueryBuilder.mockReturnValue(mockQB);
      return mockQB;
    };

    it('should return transactions without filters', async () => {
      const mockQB = setupMockQB();
      const result = await service.findByCriteria();
      expect(result).toHaveLength(1);
      expect(mockQB.andWhere).not.toHaveBeenCalled();
    });

    it('should filter by branchId', async () => {
      const mockQB = setupMockQB();
      await service.findByCriteria('b1');
      expect(mockQB.andWhere).toHaveBeenCalledWith('tx.branchId = :branchId', { branchId: 'b1' });
    });

    it('should filter by tellerUserId', async () => {
      const mockQB = setupMockQB();
      await service.findByCriteria(undefined, 't1');
      expect(mockQB.andWhere).toHaveBeenCalledWith('tx.tellerUserId = :tellerUserId', { tellerUserId: 't1' });
    });

    it('should filter by transactionType', async () => {
      const mockQB = setupMockQB();
      await service.findByCriteria(undefined, undefined, TellerTransactionType.DEPOSIT_CASH);
      expect(mockQB.andWhere).toHaveBeenCalledWith('tx.transactionType = :transactionType', {
        transactionType: TellerTransactionType.DEPOSIT_CASH,
      });
    });

    it('should filter by date range', async () => {
      const mockQB = setupMockQB();
      const from = new Date('2026-01-01');
      const to = new Date('2026-12-31');
      await service.findByCriteria(undefined, undefined, undefined, from, to);
      expect(mockQB.andWhere).toHaveBeenCalledWith('tx.processedAt >= :fromDate', { fromDate: from });
      expect(mockQB.andWhere).toHaveBeenCalledWith('tx.processedAt <= :toDate', { toDate: to });
    });

    it('should apply all filters simultaneously', async () => {
      const mockQB = setupMockQB();
      await service.findByCriteria('b1', 't1', TellerTransactionType.DEPOSIT_CASH,
        new Date('2026-01-01'), new Date('2026-12-31'));
      expect(mockQB.andWhere).toHaveBeenCalledTimes(5);
    });
  });

  describe('confirmTransaction', () => {
    it('should confirm transaction with ledger entry and witness', async () => {
      transactionRepo.findOne.mockResolvedValue({
        id: 'tx1',
        transactionReference: 'TX-202607-0001',
        transactionStatus: TellerTransactionStatus.PENDING,
      });
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.confirmTransaction('TX-202607-0001', {
        ledgerJournalEntryId: 'je-1',
        dualControlWitnessId: 'w1',
      });
      expect(result.transactionStatus).toBe(TellerTransactionStatus.COMPLETED);
      expect(result.ledgerJournalEntryId).toBe('je-1');
      expect(result.dualControlWitnessId).toBe('w1');
      expect(result.receiptPrinted).toBe(true);
      expect(result.processedAt).toBeInstanceOf(Date);
    });

    it('should confirm without optional fields', async () => {
      transactionRepo.findOne.mockResolvedValue({
        id: 'tx1',
        transactionReference: 'TX-202607-0001',
        transactionStatus: TellerTransactionStatus.PENDING,
      });
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.confirmTransaction('TX-202607-0001', {});
      expect(result.transactionStatus).toBe(TellerTransactionStatus.COMPLETED);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      transactionRepo.findOne.mockResolvedValue(null);
      await expect(service.confirmTransaction('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('reverseTransaction', () => {
    it('should reverse a completed transaction', async () => {
      transactionRepo.findOne.mockResolvedValue({
        id: 'tx1',
        transactionReference: 'TX-202607-0001',
        transactionStatus: TellerTransactionStatus.COMPLETED,
      });
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.reverseTransaction('TX-202607-0001', 'Customer dispute', 'admin-1');
      expect(result.transactionStatus).toBe(TellerTransactionStatus.REVERSED);
      expect(result.reversalReason).toBe('Customer dispute');
      expect(result.overrideApprovedBy).toBe('admin-1');
    });

    it('should throw BadRequestException when transaction already reversed', async () => {
      transactionRepo.findOne.mockResolvedValue({
        id: 'tx1',
        transactionReference: 'TX-202607-0001',
        transactionStatus: TellerTransactionStatus.REVERSED,
      });
      await expect(service.reverseTransaction('TX-202607-0001', 'reason', 'admin-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when transaction not completed', async () => {
      transactionRepo.findOne.mockResolvedValue({
        id: 'tx1',
        transactionReference: 'TX-202607-0001',
        transactionStatus: TellerTransactionStatus.PENDING,
      });
      await expect(service.reverseTransaction('TX-202607-0001', 'reason', 'admin-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      transactionRepo.findOne.mockResolvedValue(null);
      await expect(service.reverseTransaction('nonexistent', 'reason', 'admin-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('voidTransaction', () => {
    it('should void a pending transaction', async () => {
      transactionRepo.findOne.mockResolvedValue({
        id: 'tx1',
        transactionReference: 'TX-202607-0001',
        transactionStatus: TellerTransactionStatus.PENDING,
      });
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.voidTransaction('TX-202607-0001', 'Entered in error');
      expect(result.transactionStatus).toBe(TellerTransactionStatus.VOIDED);
      expect(result.reversalReason).toBe('Entered in error');
    });

    it('should throw NotFoundException when transaction not found', async () => {
      transactionRepo.findOne.mockResolvedValue(null);
      await expect(service.voidTransaction('nonexistent', 'reason'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
