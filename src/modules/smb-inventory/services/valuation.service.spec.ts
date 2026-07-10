import { ValuationService } from './valuation.service';

jest.mock('../entities/smb-stock-level.entity');
jest.mock('../entities/smb-inventory-item.entity');
jest.mock('../entities/smb-stock-movement.entity');

describe('ValuationService', () => {
  let service: ValuationService;
  let mockLevelRepo: any;
  let mockItemRepo: any;
  let mockMovementRepo: any;

  beforeEach(() => {
    mockLevelRepo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn() };
    mockItemRepo = { find: jest.fn() };
    mockMovementRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      }),
    };
    service = new ValuationService(mockLevelRepo, mockItemRepo, mockMovementRepo);
  });

  describe('generateValuationReport', () => {
    it('should return report per item with totals and byWarehouse breakdown', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Widget', sku: 'W1', valuationMethod: 'moving_average', standardCost: 10, sellingPrice: 15, category: 'Electronics' },
      ]);
      mockLevelRepo.find.mockResolvedValue([
        { warehouseId: 'wh1', onHand: 10, totalValue: 100 },
        { warehouseId: 'wh2', onHand: 5, totalValue: 50 },
      ]);

      const result = await service.generateValuationReport('comp-1');

      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe('i1');
      expect(result[0].totalQuantity).toBe(15);
      expect(result[0].totalValue).toBe(150);
      expect(result[0].avgUnitCost).toBeCloseTo(10, 1);
      expect(result[0].valuationMethod).toBe('moving_average');
      expect(result[0].byWarehouse).toHaveLength(2);
    });

    it('should return empty array when no items', async () => {
      mockItemRepo.find.mockResolvedValue([]);
      const result = await service.generateValuationReport('comp-1');
      expect(result).toEqual([]);
    });

    it('should handle items with no stock levels (zero totals)', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Empty', sku: 'E1', valuationMethod: 'fifo', standardCost: 10, sellingPrice: 15, category: 'Misc' },
      ]);
      mockLevelRepo.find.mockResolvedValue([]);

      const result = await service.generateValuationReport('comp-1');

      expect(result[0].totalQuantity).toBe(0);
      expect(result[0].totalValue).toBe(0);
      expect(result[0].avgUnitCost).toBe(0);
      expect(result[0].byWarehouse).toEqual([]);
    });
  });

  describe('calculateCogs', () => {
    it('should calculate COGS from SALE movements', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Widget' },
      ]);
      mockMovementRepo.createQueryBuilder().getMany.mockResolvedValue([
        { quantity: 5, totalCost: 50 },
        { quantity: 3, totalCost: 30 },
      ]);

      const result = await service.calculateCogs('comp-1');

      expect(result).toHaveLength(1);
      expect(result[0].quantitySold).toBe(8);
      expect(result[0].cogsTotal).toBe(80);
      expect(result[0].avgCogsPerUnit).toBe(10);
    });

    it('should apply date filters when provided', async () => {
      mockItemRepo.find.mockResolvedValue([{ id: 'i1', itemName: 'Widget' }]);
      mockMovementRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      const start = new Date('2026-01-01');
      const end = new Date('2026-06-30');

      await service.calculateCogs('comp-1', start, end);

      expect(mockMovementRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('m.createdAt >= :startDate', { startDate: start });
      expect(mockMovementRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('m.createdAt <= :endDate', { endDate: end });
    });

    it('should return 0 avgCogsPerUnit when no sales', async () => {
      mockItemRepo.find.mockResolvedValue([{ id: 'i1', itemName: 'Widget' }]);
      mockMovementRepo.createQueryBuilder().getMany.mockResolvedValue([]);

      const result = await service.calculateCogs('comp-1');

      expect(result[0].quantitySold).toBe(0);
      expect(result[0].cogsTotal).toBe(0);
      expect(result[0].avgCogsPerUnit).toBe(0);
    });
  });

  describe('generateVarianceReport', () => {
    it('should map ADJUSTMENT movements to variance entries', async () => {
      mockMovementRepo.createQueryBuilder().getMany.mockResolvedValue([
        { itemId: 'i1', warehouseId: 'wh1', quantity: -3, totalCost: -30 },
        { itemId: 'i2', warehouseId: 'wh1', quantity: 5, totalCost: 50 },
      ]);

      const result = await service.generateVarianceReport('comp-1');

      expect(result).toHaveLength(2);
      expect(result[0].itemId).toBe('i1');
      expect(result[0].recordedQty).toBe(-3);
      expect(result[0].expectedQty).toBe(0);
      expect(result[0].varianceQty).toBe(-3);
      expect(result[0].varianceCost).toBe(-30);
    });

    it('should return empty array when no adjustments', async () => {
      mockMovementRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      const result = await service.generateVarianceReport('comp-1');
      expect(result).toEqual([]);
    });
  });

  describe('recalculateMovingAvg', () => {
    it('should recalculate from movements chronologically', async () => {
      const level = { movingAvgCost: 0, onHand: 0, totalValue: 0 };
      mockMovementRepo.find.mockResolvedValue([
        { quantity: 10, unitCost: 5, createdAt: new Date('2026-01-01') },
        { quantity: 10, unitCost: 15, createdAt: new Date('2026-01-02') },
        { quantity: -5, unitCost: 0, createdAt: new Date('2026-01-03') },
      ]);
      mockLevelRepo.findOne.mockResolvedValue(level);

      await service.recalculateMovingAvg('i1', 'wh1');

      expect(mockMovementRepo.find).toHaveBeenCalledWith({ where: { itemId: 'i1', warehouseId: 'wh1' }, order: { createdAt: 'ASC' } });
      // After receive 10@5: onHand=10, avg=5
      // After receive 10@15: onHand=20, avg=(50+150)/20=10
      // After sale -5: onHand=15
      expect(level.onHand).toBe(15);
      expect(level.movingAvgCost).toBe(10);
      expect(level.totalValue).toBe(150);
      expect(mockLevelRepo.save).toHaveBeenCalledWith(level);
    });

    it('should handle no movements', async () => {
      const level = { movingAvgCost: 0, onHand: 0, totalValue: 0 };
      mockMovementRepo.find.mockResolvedValue([]);
      mockLevelRepo.findOne.mockResolvedValue(level);

      await service.recalculateMovingAvg('i1', 'wh1');

      expect(level.movingAvgCost).toBe(0);
      expect(level.onHand).toBe(0);
      expect(mockLevelRepo.save).toHaveBeenCalledWith(level);
    });

    it('should not crash when level not found', async () => {
      mockMovementRepo.find.mockResolvedValue([]);
      mockLevelRepo.findOne.mockResolvedValue(null);

      await expect(service.recalculateMovingAvg('i1', 'wh1')).resolves.toBeUndefined();
    });
  });

  describe('generateIas2Report', () => {
    it('should return cost, NRV, and writeDown', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Widget', standardCost: 10, sellingPrice: 15, category: 'Electronics' },
        { id: 'i2', itemName: 'Gadget', standardCost: 20, sellingPrice: 12, category: 'Electronics' },
      ]);
      mockLevelRepo.find.mockResolvedValueOnce([{ onHand: 10 }])
        .mockResolvedValueOnce([{ onHand: 5 }]);

      const result = await service.generateIas2Report('comp-1');

      // Item1: cost=100, nrv=150
      // Item2: cost=100, nrv=60
      expect(result.inventoryAtCost).toBe(200);
      expect(result.inventoryAtNetRealizable).toBe(210);
      expect(result.writeDownRequired).toBe(0); // NRV > Cost overall
    });

    it('should calculate writeDown when cost > NRV', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Widget', standardCost: 20, sellingPrice: 10, category: 'Misc' },
      ]);
      mockLevelRepo.find.mockResolvedValue([{ onHand: 10 }]);

      const result = await service.generateIas2Report('comp-1');

      expect(result.inventoryAtCost).toBe(200);
      expect(result.inventoryAtNetRealizable).toBe(100);
      expect(result.writeDownRequired).toBe(100);
    });

    it('should group byCategory', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'A', standardCost: 10, sellingPrice: 15, category: 'Electronics' },
        { id: 'i2', itemName: 'B', standardCost: 5, sellingPrice: 8, category: 'Tools' },
      ]);
      mockLevelRepo.find.mockResolvedValue([{ onHand: 10 }]);

      const result = await service.generateIas2Report('comp-1');

      expect(result.byCategory).toHaveLength(2);
      expect(result.byCategory.find(c => c.category === 'Electronics')).toBeDefined();
      expect(result.byCategory.find(c => c.category === 'Tools')).toBeDefined();
    });

    it('should use Uncategorized when category is null', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'A', standardCost: 10, sellingPrice: 15, category: null },
      ]);
      mockLevelRepo.find.mockResolvedValue([{ onHand: 5 }]);

      const result = await service.generateIas2Report('comp-1');

      expect(result.byCategory[0].category).toBe('Uncategorized');
    });

    it('should handle no items', async () => {
      mockItemRepo.find.mockResolvedValue([]);
      const result = await service.generateIas2Report('comp-1');
      expect(result.inventoryAtCost).toBe(0);
      expect(result.inventoryAtNetRealizable).toBe(0);
      expect(result.writeDownRequired).toBe(0);
      expect(result.byCategory).toEqual([]);
    });
  });
});
