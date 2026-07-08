import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbReportingService } from './smb-reporting.service';
import { SmbReportSnapshot } from '../entities/smb-report-snapshot.entity';
import { SmbInventoryItem } from '../../smb-inventory/entities/smb-inventory-item.entity';
import { SmbStockLevel } from '../../smb-inventory/entities/smb-stock-level.entity';
import { SmbStockMovement } from '../../smb-inventory/entities/smb-stock-movement.entity';
import { ValuationService } from '../../smb-inventory/services/valuation.service';

describe('SmbReportingService', () => {
  let service: SmbReportingService;

  const mockSnapshotRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockItemRepo = {
    find: jest.fn(),
  };

  const mockLevelRepo = {
    find: jest.fn(),
  };

  const mockMovementRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockValuationService = {
    generateIas2Report: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmbReportingService,
        { provide: getRepositoryToken(SmbReportSnapshot), useValue: mockSnapshotRepo },
        { provide: getRepositoryToken(SmbInventoryItem), useValue: mockItemRepo },
        { provide: getRepositoryToken(SmbStockLevel), useValue: mockLevelRepo },
        { provide: getRepositoryToken(SmbStockMovement), useValue: mockMovementRepo },
        { provide: ValuationService, useValue: mockValuationService },
      ],
    }).compile();

    service = module.get<SmbReportingService>(SmbReportingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // === GET INVENTORY VALUATION ===
  describe('getInventoryValuation', () => {
    it('should calculate valuation for items', async () => {
      const items = [
        { id: 'item-1', sku: 'SKU-001', itemName: 'Widget A', category: 'Tools', standardCost: 10, sellingPrice: 25 },
        { id: 'item-2', sku: 'SKU-002', itemName: 'Widget B', category: 'Tools', standardCost: 20, sellingPrice: 50 },
      ];
      mockItemRepo.find.mockResolvedValue(items);
      mockLevelRepo.find
        .mockResolvedValueOnce([{ onHand: 100, available: 80, committed: 20, movingAvgCost: 9 }])
        .mockResolvedValueOnce([{ onHand: 50, available: 40, committed: 10, movingAvgCost: 18 }]);

      const result = await service.getInventoryValuation({
        companyProfileId: 'comp-1',
        asOfDate: '2026-07-08',
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].onHand).toBe(100);
      expect(result.items[0].valueAtCost).toBe(1000);
      expect(result.items[0].valueAtNRV).toBe(2500);
      expect(result.totals.totalItems).toBe(2);
      expect(result.totals.totalUnitsOnHand).toBe(150);
      expect(result.totals.totalValueAtCost).toBe(2000);
      expect(result.totals.totalValueAtNRV).toBe(5000);
      expect(result.asOfDate).toBe('2026-07-08');
    });

    it('should filter by warehouse when provided', async () => {
      mockItemRepo.find.mockResolvedValue([{ id: 'item-1', sku: 'SKU-001', itemName: 'Widget A', category: 'Tools', standardCost: 10, sellingPrice: 25 }]);
      mockLevelRepo.find.mockResolvedValue([]);

      await service.getInventoryValuation({
        companyProfileId: 'comp-1',
        warehouseId: 'wh-1',
      });

      expect(mockLevelRepo.find).toHaveBeenCalledWith({ where: expect.objectContaining({ warehouseId: 'wh-1' }) });
    });

    it('should handle items with no stock levels', async () => {
      mockItemRepo.find.mockResolvedValue([{ id: 'item-1', sku: 'SKU-001', itemName: 'Empty', category: 'Misc', standardCost: 5, sellingPrice: 10 }]);
      mockLevelRepo.find.mockResolvedValue([]);

      const result = await service.getInventoryValuation({ companyProfileId: 'comp-1' });
      expect(result.items[0].onHand).toBe(0);
      expect(result.items[0].valueAtCost).toBe(0);
      expect(result.items[0].movingAvgCost).toBe(0);
    });

    it('should handle empty item list', async () => {
      mockItemRepo.find.mockResolvedValue([]);

      const result = await service.getInventoryValuation({ companyProfileId: 'comp-1' });
      expect(result.items).toHaveLength(0);
      expect(result.totals.totalItems).toBe(0);
      expect(result.totals.totalValueAtCost).toBe(0);
    });

    it('should use current date when asOfDate not provided', async () => {
      mockItemRepo.find.mockResolvedValue([]);
      const result = await service.getInventoryValuation({ companyProfileId: 'comp-1' });
      expect(result.asOfDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // === GET STOCK MOVEMENT HISTORY ===
  describe('getStockMovementHistory', () => {
    const mockQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      mockMovementRepo.createQueryBuilder.mockReturnValue(mockQb);
      jest.clearAllMocks();
      mockMovementRepo.createQueryBuilder.mockReturnValue(mockQb);
      mockQb.where.mockReturnThis();
      mockQb.andWhere.mockReturnThis();
      mockQb.orderBy.mockReturnThis();
      mockQb.limit.mockReturnThis();
    });

    it('should query movements with filters', async () => {
      const movements = [
        { quantity: 10, createdAt: new Date() },
        { quantity: -5, createdAt: new Date() },
      ];
      mockQb.getMany.mockResolvedValue(movements);

      const result = await service.getStockMovementHistory({
        companyProfileId: 'comp-1',
        itemId: 'item-1',
        warehouseId: 'wh-1',
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      });

      expect(mockQb.where).toHaveBeenCalledWith('m.company_profile_id = :companyId', { companyId: 'comp-1' });
      expect(mockQb.andWhere).toHaveBeenCalled();
      expect(mockQb.orderBy).toHaveBeenCalledWith('m.created_at', 'DESC');
      expect(mockQb.limit).toHaveBeenCalledWith(500);
      expect(result.movements).toHaveLength(2);
      expect(result.summary.totalMovements).toBe(2);
      expect(result.summary.totalIn).toBe(10);
      expect(result.summary.totalOut).toBe(5);
    });

    it('should handle empty results', async () => {
      mockQb.getMany.mockResolvedValue([]);
      const result = await service.getStockMovementHistory({ companyProfileId: 'comp-1' });
      expect(result.summary.totalMovements).toBe(0);
      expect(result.summary.totalIn).toBe(0);
      expect(result.summary.totalOut).toBe(0);
    });
  });

  // === GET INVENTORY AGING ===
  describe('getInventoryAging', () => {
    it('should bucket items by age', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      const items = [
        { id: 'item-1', sku: 'SKU-001', itemName: 'Recent', standardCost: 10 },
        { id: 'item-2', sku: 'SKU-002', itemName: 'Old', standardCost: 20 },
      ];
      mockItemRepo.find.mockResolvedValue(items);
      mockLevelRepo.find
        .mockResolvedValueOnce([{ onHand: 10 }])
        .mockResolvedValueOnce([{ onHand: 5 }]);

      const recentDate = new Date();
      mockMovementRepo.findOne
        .mockResolvedValueOnce({ createdAt: new Date() }) // recent — 0 days
        .mockResolvedValueOnce({ createdAt: oldDate });    // old — 100 days

      const result = await service.getInventoryAging({ companyProfileId: 'comp-1' });

      expect(result.agingBuckets.current.length + result.agingBuckets.days90Plus.length).toBeGreaterThanOrEqual(1);
      expect(result.totals).toBeDefined();
      expect(result.generatedAt).toBeDefined();
    });

    it('should skip items with zero stock', async () => {
      mockItemRepo.find.mockResolvedValue([{ id: 'item-1', sku: 'SKU-001', itemName: 'Zero', standardCost: 10 }]);
      mockLevelRepo.find.mockResolvedValue([{ onHand: 0 }]);

      const result = await service.getInventoryAging({ companyProfileId: 'comp-1' });
      expect(result.agingBuckets.current).toHaveLength(0);
      expect(result.agingBuckets.days90Plus).toHaveLength(0);
    });

    it('should skip items without movement history', async () => {
      mockItemRepo.find.mockResolvedValue([{ id: 'item-1', sku: 'SKU-001', itemName: 'NoMove', standardCost: 10 }]);
      mockLevelRepo.find.mockResolvedValue([{ onHand: 5 }]);
      mockMovementRepo.findOne.mockResolvedValue(null);

      const result = await service.getInventoryAging({ companyProfileId: 'comp-1' });
      expect(result.agingBuckets.current).toHaveLength(0);
    });

    it('should filter by minDays/maxDays', async () => {
      const items = [{ id: 'item-1', sku: 'SKU-001', itemName: 'Test', standardCost: 10 }];
      mockItemRepo.find.mockResolvedValue(items);
      mockLevelRepo.find.mockResolvedValue([{ onHand: 5 }]);
      mockMovementRepo.findOne.mockResolvedValue({ createdAt: new Date() });

      const result = await service.getInventoryAging({ companyProfileId: 'comp-1', minDays: 100, maxDays: 200 });
      // Recent item won't pass 100-day minimum
      expect(result.agingBuckets.current).toHaveLength(0);
    });
  });

  // === GET INVENTORY SUMMARY ===
  describe('getInventorySummary', () => {
    it('should return executive summary', async () => {
      const items = [
        { id: 'item-1', sku: 'SKU-001', itemName: 'Widget A', standardCost: 10, reorderPoint: 5 },
        { id: 'item-2', sku: 'SKU-002', itemName: 'Widget B', standardCost: 20, reorderPoint: 0 },
      ];
      mockItemRepo.find.mockResolvedValue(items);
      mockLevelRepo.find
        .mockResolvedValueOnce([{ onHand: 3, available: 2, committed: 1 }])
        .mockResolvedValueOnce([{ onHand: 50, available: 45, committed: 5 }]);

      const result = await service.getInventorySummary('comp-1');

      expect(result.totalActiveItems).toBe(2);
      expect(result.totalUnitsOnHand).toBe(53);
      expect(result.totalInventoryValueAtCost).toBe(1030);
      expect(result.lowStockCount).toBe(1);
      expect(result.lowStockAlerts[0].itemId).toBe('item-1');
      expect(result.warehouseId).toBe('all');
      expect(result.generatedAt).toBeDefined();
    });

    it('should filter by warehouse', async () => {
      mockItemRepo.find.mockResolvedValue([{ id: 'item-1', sku: 'SKU-001', itemName: 'Test', standardCost: 10 }]);
      mockLevelRepo.find.mockResolvedValue([{ onHand: 5 }]);
      await service.getInventorySummary('comp-1', 'wh-1');
      expect(mockLevelRepo.find).toHaveBeenCalledWith({ where: expect.objectContaining({ warehouseId: 'wh-1' }) });
    });

    it('should handle empty inventory', async () => {
      mockItemRepo.find.mockResolvedValue([]);
      const result = await service.getInventorySummary('comp-1');
      expect(result.totalActiveItems).toBe(0);
      expect(result.totalUnitsOnHand).toBe(0);
      expect(result.lowStockCount).toBe(0);
    });
  });

  // === GET IAS2 REPORT ===
  describe('getIas2Report', () => {
    it('should delegate to ValuationService', async () => {
      mockValuationService.generateIas2Report.mockResolvedValue({ totalValue: 50000, categories: [] });
      const result = await service.getIas2Report('comp-1');
      expect(mockValuationService.generateIas2Report).toHaveBeenCalledWith('comp-1');
      expect(result.totalValue).toBe(50000);
    });
  });

  // === SAVE SNAPSHOT ===
  describe('saveSnapshot', () => {
    it('should create and save a snapshot', async () => {
      const created = { id: 'snap-1', reportType: 'valuation', isValid: true };
      mockSnapshotRepo.create.mockReturnValue(created);
      mockSnapshotRepo.save.mockResolvedValue(created);

      const result = await service.saveSnapshot(
        'valuation', 'comp-1', '2026-07-08', { total: 5000 }, 'wh-1', 'user-1', 'MX',
      );

      expect(result.id).toBe('snap-1');
      expect(mockSnapshotRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        reportType: 'valuation',
        companyProfileId: 'comp-1',
        reportDate: '2026-07-08',
        reportData: { total: 5000 },
        warehouseId: 'wh-1',
        generatedByUserId: 'user-1',
        jurisdictionCode: 'MX',
        isValid: true,
      }));
    });

    it('should work with minimal params', async () => {
      mockSnapshotRepo.create.mockReturnValue({ id: 'snap-2' });
      mockSnapshotRepo.save.mockResolvedValue({ id: 'snap-2' });

      const result = await service.saveSnapshot('summary', 'comp-1', '2026-07-08', {});
      expect(result.id).toBe('snap-2');
    });
  });

  // === GET SNAPSHOT HISTORY ===
  describe('getSnapshotHistory', () => {
    it('should return snapshots filtered by company', async () => {
      const snapshots = [{ id: 's1' }, { id: 's2' }];
      mockSnapshotRepo.find.mockResolvedValue(snapshots);

      const result = await service.getSnapshotHistory('comp-1');
      expect(result).toHaveLength(2);
      expect(mockSnapshotRepo.find).toHaveBeenCalledWith({
        where: { companyProfileId: 'comp-1', isValid: true },
        order: { generatedAt: 'DESC' },
        take: 50,
      });
    });

    it('should filter by reportType when provided', async () => {
      mockSnapshotRepo.find.mockResolvedValue([]);
      await service.getSnapshotHistory('comp-1', 'valuation');
      expect(mockSnapshotRepo.find).toHaveBeenCalledWith({
        where: { companyProfileId: 'comp-1', isValid: true, reportType: 'valuation' },
        order: { generatedAt: 'DESC' },
        take: 50,
      });
    });
  });
});
