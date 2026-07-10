import { InventoryReportService } from './inventory-report.service';

jest.mock('../entities/smb-inventory-item.entity');
jest.mock('../entities/smb-stock-level.entity');
jest.mock('../entities/smb-stock-movement.entity');
jest.mock('../entities/smb-warehouse.entity');

describe('InventoryReportService', () => {
  let service: InventoryReportService;
  let mockItemRepo: any;
  let mockLevelRepo: any;
  let mockMovementRepo: any;
  let mockWarehouseRepo: any;

  beforeEach(() => {
    mockItemRepo = { find: jest.fn() };
    mockLevelRepo = { find: jest.fn() };
    mockMovementRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      }),
    };
    mockWarehouseRepo = { find: jest.fn() };
    service = new InventoryReportService(mockItemRepo, mockLevelRepo, mockMovementRepo, mockWarehouseRepo);
  });

  describe('generateSummary', () => {
    it('should return summary with zero values for empty company', async () => {
      mockItemRepo.find.mockResolvedValue([]);
      mockWarehouseRepo.find.mockResolvedValue([]);

      const result = await service.generateSummary('comp-1');

      expect(result.totalItems).toBe(0);
      expect(result.activeItems).toBe(0);
      expect(result.totalWarehouses).toBe(0);
      expect(result.totalStockValue).toBe(0);
      expect(result.lowStockCount).toBe(0);
      expect(result.outOfStockCount).toBe(0);
      expect(result.totalOnHandUnits).toBe(0);
    });

    it('should count active and inactive items', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', isActive: true, reorderLevel: 5 },
        { id: 'i2', isActive: false, reorderLevel: 5 },
      ]);
      mockWarehouseRepo.find.mockResolvedValue([{ id: 'wh1' }, { id: 'wh2' }]);
      mockLevelRepo.find.mockResolvedValue([]);

      const result = await service.generateSummary('comp-1');

      expect(result.totalItems).toBe(2);
      expect(result.activeItems).toBe(1);
      expect(result.totalWarehouses).toBe(2);
    });

    it('should count out-of-stock items', async () => {
      mockItemRepo.find.mockResolvedValue([{ id: 'i1', isActive: true, reorderLevel: 5 }]);
      mockWarehouseRepo.find.mockResolvedValue([]);
      mockLevelRepo.find.mockResolvedValue([{ onHand: 0, totalValue: 0 }]);

      const result = await service.generateSummary('comp-1');

      expect(result.outOfStockCount).toBe(1);
    });

    it('should count low-stock items below reorderLevel', async () => {
      mockItemRepo.find.mockResolvedValue([{ id: 'i1', isActive: true, reorderLevel: 10 }]);
      mockWarehouseRepo.find.mockResolvedValue([]);
      mockLevelRepo.find.mockResolvedValue([{ onHand: 3, totalValue: 30 }]);

      const result = await service.generateSummary('comp-1');

      expect(result.lowStockCount).toBe(1);
    });

    it('should aggregate totalStockValue and totalOnHandUnits', async () => {
      mockItemRepo.find.mockResolvedValue([{ id: 'i1', isActive: true, reorderLevel: 0 }]);
      mockWarehouseRepo.find.mockResolvedValue([]);
      mockLevelRepo.find.mockResolvedValue([{ onHand: 10, totalValue: 100 }, { onHand: 5, totalValue: 50 }]);

      const result = await service.generateSummary('comp-1');

      expect(result.totalOnHandUnits).toBe(15);
      expect(result.totalStockValue).toBe(150);
    });
  });

  describe('generateMovementHistory', () => {
    it('should group by movementType and return mapped results', async () => {
      mockMovementRepo.createQueryBuilder().getRawMany.mockResolvedValue([
        { movementType: 'RECEIVE', count: '5', totalQuantity: '50', totalCost: '500' },
        { movementType: 'SALE', count: '3', totalQuantity: '15', totalCost: '150' },
      ]);

      const result = await service.generateMovementHistory('comp-1');

      expect(result).toHaveLength(2);
      expect(result[0].movementType).toBe('RECEIVE');
      expect(result[0].count).toBe(5);
      expect(result[0].totalQuantity).toBe(50);
      expect(result[0].totalCost).toBe(500);
      expect(result[1].movementType).toBe('SALE');
      expect(result[1].count).toBe(3);
    });

    it('should apply date filters when provided', async () => {
      mockMovementRepo.createQueryBuilder().getRawMany.mockResolvedValue([]);
      const start = new Date('2026-01-01');
      const end = new Date('2026-06-30');

      await service.generateMovementHistory('comp-1', start, end);

      expect(mockMovementRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('m.createdAt >= :startDate', { startDate: start });
      expect(mockMovementRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('m.createdAt <= :endDate', { endDate: end });
    });

    it('should return empty array when no movements', async () => {
      mockMovementRepo.createQueryBuilder().getRawMany.mockResolvedValue([]);
      const result = await service.generateMovementHistory('comp-1');
      expect(result).toEqual([]);
    });
  });

  describe('generateWarehouseDistribution', () => {
    it('should return distribution per warehouse', async () => {
      mockWarehouseRepo.find.mockResolvedValue([{ id: 'wh1', name: 'Main' }, { id: 'wh2', name: 'Secondary' }]);
      mockLevelRepo.find.mockResolvedValueOnce([{ onHand: 10, totalValue: 100 }, { onHand: 5, totalValue: 50 }])
        .mockResolvedValueOnce([{ onHand: 3, totalValue: 30 }]);

      const result = await service.generateWarehouseDistribution('comp-1');

      expect(result).toHaveLength(2);
      expect(result[0].warehouseId).toBe('wh1');
      expect(result[0].warehouseName).toBe('Main');
      expect(result[0].itemCount).toBe(2);
      expect(result[0].totalUnits).toBe(15);
      expect(result[0].totalValue).toBe(150);
      expect(result[1].warehouseId).toBe('wh2');
      expect(result[1].totalUnits).toBe(3);
    });

    it('should return empty array when no warehouses', async () => {
      mockWarehouseRepo.find.mockResolvedValue([]);
      const result = await service.generateWarehouseDistribution('comp-1');
      expect(result).toEqual([]);
    });
  });

  describe('generateAbcAnalysis', () => {
    it('should classify items into A (<=80%), B (<=95%), C (>95%)', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Item1', totalValue: 0, isActive: true },
        { id: 'i2', itemName: 'Item2', totalValue: 0, isActive: true },
        { id: 'i3', itemName: 'Item3', totalValue: 0, isActive: true },
      ]);
      mockLevelRepo.find.mockResolvedValueOnce([{ totalValue: 80 }])
        .mockResolvedValueOnce([{ totalValue: 15 }])
        .mockResolvedValueOnce([{ totalValue: 5 }]);

      const result = await service.generateAbcAnalysis('comp-1');

      expect(result.classA).toHaveLength(1);
      expect(result.classB).toHaveLength(1);
      expect(result.classC).toHaveLength(1);
      expect(result.classA[0].itemId).toBe('i1');
    });

    it('should handle empty items', async () => {
      mockItemRepo.find.mockResolvedValue([]);
      const result = await service.generateAbcAnalysis('comp-1');
      expect(result.classA).toEqual([]);
      expect(result.classB).toEqual([]);
      expect(result.classC).toEqual([]);
    });
  });

  describe('generateAgingReport', () => {
    it('should classify levels by days since last movement', async () => {
      const now = Date.now();
      mockItemRepo.find.mockResolvedValue([{ id: 'i1', itemName: 'Item1', isActive: true }]);
      mockLevelRepo.find.mockResolvedValue([
        { onHand: 10, totalValue: 100, lastMovementDate: new Date(now - 10 * 86400000) },
        { onHand: 5, totalValue: 50, lastMovementDate: new Date(now - 60 * 86400000) },
        { onHand: 3, totalValue: 30, lastMovementDate: new Date(now - 120 * 86400000) },
      ]);

      const result = await service.generateAgingReport('comp-1');

      expect(result.fresh).toHaveLength(1);
      expect(result.aging).toHaveLength(1);
      expect(result.stale).toHaveLength(1);
    });

    it('should skip levels with zero onHand', async () => {
      mockItemRepo.find.mockResolvedValue([{ id: 'i1', itemName: 'Item1', isActive: true }]);
      mockLevelRepo.find.mockResolvedValue([
        { onHand: 0, totalValue: 0, lastMovementDate: new Date() },
      ]);

      const result = await service.generateAgingReport('comp-1');

      expect(result.fresh).toHaveLength(0);
      expect(result.aging).toHaveLength(0);
      expect(result.stale).toHaveLength(0);
    });

    it('should skip levels without lastMovementDate', async () => {
      mockItemRepo.find.mockResolvedValue([{ id: 'i1', itemName: 'Item1', isActive: true }]);
      mockLevelRepo.find.mockResolvedValue([
        { onHand: 10, totalValue: 100, lastMovementDate: null },
      ]);

      const result = await service.generateAgingReport('comp-1');

      expect(result.fresh).toHaveLength(0);
    });
  });
});
