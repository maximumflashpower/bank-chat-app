import { DrawerManagementService } from './drawer-management.service';
import { TellerCashDrawer, DrawerShiftStatus, VarianceType } from '../entities/teller-cash-drawer.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DrawerManagementService', () => {
  let service: DrawerManagementService;
  let drawerRepo: any;

  beforeEach(() => {
    drawerRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new DrawerManagementService(drawerRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // openDrawer
  // ═══════════════════════════════════════════════════
  describe('openDrawer', () => {
    const baseDto = {
      drawerNumber: 'DRW-001',
      branchId: 'b1',
      tellerUserId: 't1',
      openingBalanceTotal: 5000,
      maxCashLimit: 100000,
    };

    it('should open a drawer successfully', async () => {
      drawerRepo.findOne.mockResolvedValue(null);
      drawerRepo.create.mockImplementation((data: any) => ({ ...data }));
      drawerRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.openDrawer(baseDto as any);
      expect(result.shiftStatus).toBe(DrawerShiftStatus.OPEN);
      expect(result.currentBalanceTotal).toBe(5000);
      expect(result.totalTransactionsCount).toBe(0);
      expect(result.varianceAmount).toBe(0);
      expect(result.varianceType).toBe(VarianceType.BALANCED);
      expect(result.openedAt).toBeInstanceOf(Date);
      expect(drawerRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when teller already has open drawer', async () => {
      drawerRepo.findOne.mockResolvedValueOnce({
        id: 'd-existing',
        drawerNumber: 'DRW-OLD',
        shiftStatus: DrawerShiftStatus.OPEN,
      });

      await expect(service.openDrawer(baseDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when drawer number already in use', async () => {
      // First findOne (teller check) returns null
      drawerRepo.findOne.mockResolvedValueOnce(null);
      // Second findOne (drawer number check) returns existing
      drawerRepo.findOne.mockResolvedValueOnce({
        id: 'd-other',
        drawerNumber: 'DRW-001',
        shiftStatus: DrawerShiftStatus.OPEN,
      });

      await expect(service.openDrawer(baseDto as any)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════
  // closeDrawer
  // ═══════════════════════════════════════════════════
  describe('closeDrawer', () => {
    const mockDrawer = {
      id: 'd1',
      drawerNumber: 'DRW-001',
      shiftStatus: DrawerShiftStatus.OPEN,
      currentBalanceTotal: 5000,
      openingBalanceTotal: 5000,
    };

    it('should close drawer with zero variance (balanced)', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      drawerRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.closeDrawer({
        drawerId: 'd1',
        closingBalanceTotal: 5000,
      } as any);

      expect(result.shiftStatus).toBe(DrawerShiftStatus.CLOSED);
      expect(result.varianceAmount).toBe(0);
      expect(result.varianceType).toBe(VarianceType.BALANCED);
      expect(result.closedAt).toBeInstanceOf(Date);
    });

    it('should detect surplus variance', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      drawerRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.closeDrawer({
        drawerId: 'd1',
        closingBalanceTotal: 5030,
      } as any);

      expect(result.varianceAmount).toBe(30);
      expect(result.varianceType).toBe(VarianceType.SURPLUS);
    });

    it('should detect shortage variance', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      drawerRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.closeDrawer({
        drawerId: 'd1',
        closingBalanceTotal: 4970,
      } as any);

      expect(result.varianceAmount).toBe(-30);
      expect(result.varianceType).toBe(VarianceType.SHORTAGE);
    });

    it('should throw BadRequestException when variance exceeds $50 without override', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });

      await expect(
        service.closeDrawer({
          drawerId: 'd1',
          closingBalanceTotal: 5100,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow large variance with override approval', async () => {
      drawerRepo.findOne.mockResolvedValue({ ...mockDrawer });
      drawerRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.closeDrawer({
        drawerId: 'd1',
        closingBalanceTotal: 5100,
        overrideApprovedBy: 'supervisor-1',
      } as any);

      expect(result.varianceAmount).toBe(100);
      expect(result.overrideApprovedBy).toBe('supervisor-1');
    });

    it('should throw BadRequestException when drawer already closed', async () => {
      drawerRepo.findOne.mockResolvedValue({
        ...mockDrawer,
        shiftStatus: DrawerShiftStatus.CLOSED,
      });

      await expect(
        service.closeDrawer({ drawerId: 'd1', closingBalanceTotal: 5000 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when drawer not found', async () => {
      drawerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.closeDrawer({ drawerId: 'nonexistent', closingBalanceTotal: 5000 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // getActiveDrawers
  // ═══════════════════════════════════════════════════
  describe('getActiveDrawers', () => {
    it('should return active drawers for a branch', async () => {
      const mockDrawers = [
        { id: 'd1', branchId: 'b1', shiftStatus: DrawerShiftStatus.OPEN },
        { id: 'd2', branchId: 'b1', shiftStatus: DrawerShiftStatus.OPEN },
      ];
      drawerRepo.find.mockResolvedValue(mockDrawers);

      const result = await service.getActiveDrawers('b1');
      expect(result).toHaveLength(2);
      expect(drawerRepo.find).toHaveBeenCalledWith({
        where: { branchId: 'b1', shiftStatus: DrawerShiftStatus.OPEN },
        order: { openedAt: 'DESC' },
      });
    });
  });

  // ═══════════════════════════════════════════════════
  // getAllDrawers
  // ═══════════════════════════════════════════════════
  describe('getAllDrawers', () => {
    it('should return all drawers without filters', async () => {
      drawerRepo.find.mockResolvedValue([{ id: 'd1' }]);
      const result = await service.getAllDrawers();
      expect(result).toHaveLength(1);
      expect(drawerRepo.find).toHaveBeenCalledWith({
        where: {},
        order: { openedAt: 'DESC' },
      });
    });

    it('should filter by branchId', async () => {
      drawerRepo.find.mockResolvedValue([]);
      await service.getAllDrawers('b1');
      expect(drawerRepo.find).toHaveBeenCalledWith({
        where: { branchId: 'b1' },
        order: { openedAt: 'DESC' },
      });
    });

    it('should filter by shiftStatus', async () => {
      drawerRepo.find.mockResolvedValue([]);
      await service.getAllDrawers(undefined, DrawerShiftStatus.OPEN);
      expect(drawerRepo.find).toHaveBeenCalledWith({
        where: { shiftStatus: DrawerShiftStatus.OPEN },
        order: { openedAt: 'DESC' },
      });
    });
  });

  // ═══════════════════════════════════════════════════
  // getById
  // ═══════════════════════════════════════════════════
  describe('getById', () => {
    it('should return drawer by ID', async () => {
      const mockDrawer = { id: 'd1', drawerNumber: 'DRW-001' };
      drawerRepo.findOne.mockResolvedValue(mockDrawer);

      const result = await service.getById('d1');
      expect(result).toBe(mockDrawer);
    });

    it('should throw NotFoundException when drawer not found', async () => {
      drawerRepo.findOne.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // updateCurrentBalance
  // ═══════════════════════════════════════════════════
  describe('updateCurrentBalance', () => {
    it('should adjust current balance by positive amount', async () => {
      const mockDrawer = { id: 'd1', currentBalanceTotal: 5000 };
      drawerRepo.findOne.mockResolvedValue(mockDrawer);
      drawerRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.updateCurrentBalance('d1', 1000);
      expect(mockDrawer.currentBalanceTotal).toBe(6000);
      expect(drawerRepo.save).toHaveBeenCalledWith(mockDrawer);
    });

    it('should adjust current balance by negative amount', async () => {
      const mockDrawer = { id: 'd1', currentBalanceTotal: 5000 };
      drawerRepo.findOne.mockResolvedValue(mockDrawer);
      drawerRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.updateCurrentBalance('d1', -2000);
      expect(mockDrawer.currentBalanceTotal).toBe(3000);
    });
  });

  // ═══════════════════════════════════════════════════
  // getDailyStats
  // ═══════════════════════════════════════════════════
  describe('getDailyStats', () => {
    it('should compute daily stats correctly', async () => {
      const mockDrawers = [
        {
          id: 'd1',
          shiftStatus: DrawerShiftStatus.OPEN,
          totalTransactionsCount: 5,
          currentBalanceTotal: 5000,
          varianceAmount: 10,
        },
        {
          id: 'd2',
          shiftStatus: DrawerShiftStatus.CLOSED,
          totalTransactionsCount: 3,
          currentBalanceTotal: 3000,
          varianceAmount: -5,
        },
      ];
      drawerRepo.find.mockResolvedValue(mockDrawers);

      const result = await service.getDailyStats('t1', 'b1');
      expect(result.totalDrawers).toBe(2);
      expect(result.activeDrawers).toBe(1);
      expect(result.totalTransactions).toBe(8);
      expect(result.totalCashHandled).toBe(8000);
      expect(result.totalVariance).toBe(5);
    });

    it('should handle no drawers', async () => {
      drawerRepo.find.mockResolvedValue([]);

      const result = await service.getDailyStats('t1', 'b1');
      expect(result.totalDrawers).toBe(0);
      expect(result.activeDrawers).toBe(0);
      expect(result.totalTransactions).toBe(0);
      expect(result.totalCashHandled).toBe(0);
      expect(result.totalVariance).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════
  // incrementTransactionCounts
  // ═══════════════════════════════════════════════════
  describe('incrementTransactionCounts', () => {
    it('should increment deposit count and amount', async () => {
      const mockDrawer = {
        id: 'd1',
        totalTransactionsCount: 5,
        totalDepositsAmount: 1000,
        totalWithdrawalsAmount: 500,
      };
      drawerRepo.findOne.mockResolvedValue(mockDrawer);
      drawerRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.incrementTransactionCounts('d1', true, 500);
      expect(mockDrawer.totalTransactionsCount).toBe(6);
      expect(mockDrawer.totalDepositsAmount).toBe(1500);
      expect(mockDrawer.totalWithdrawalsAmount).toBe(500);
    });

    it('should increment withdrawal count and amount', async () => {
      const mockDrawer = {
        id: 'd1',
        totalTransactionsCount: 5,
        totalDepositsAmount: 1000,
        totalWithdrawalsAmount: 500,
      };
      drawerRepo.findOne.mockResolvedValue(mockDrawer);
      drawerRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.incrementTransactionCounts('d1', false, 300);
      expect(mockDrawer.totalTransactionsCount).toBe(6);
      expect(mockDrawer.totalDepositsAmount).toBe(1000);
      expect(mockDrawer.totalWithdrawalsAmount).toBe(800);
    });

    it('should handle null deposit/withdrawal amounts', async () => {
      const mockDrawer = {
        id: 'd1',
        totalTransactionsCount: 0,
        totalDepositsAmount: null,
        totalWithdrawalsAmount: null,
      };
      drawerRepo.findOne.mockResolvedValue(mockDrawer);
      drawerRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.incrementTransactionCounts('d1', true, 500);
      expect(mockDrawer.totalTransactionsCount).toBe(1);
      expect(mockDrawer.totalDepositsAmount).toBe(500);
    });
  });
});
