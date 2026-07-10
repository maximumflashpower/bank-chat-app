import { ReorderService } from './reorder.service';

jest.mock('../entities/smb-inventory-item.entity');
jest.mock('../entities/smb-stock-level.entity');

describe('ReorderService', () => {
  let service: ReorderService;
  let mockItemRepo: any;
  let mockLevelRepo: any;

  beforeEach(() => {
    mockItemRepo = { find: jest.fn(), findOne: jest.fn() };
    mockLevelRepo = { find: jest.fn() };
    service = new ReorderService(mockItemRepo, mockLevelRepo);
  });

  describe('generateReorderRecommendations', () => {
    it('should return empty when no items', async () => {
      mockItemRepo.find.mockResolvedValue([]);
      const result = await service.generateReorderRecommendations('comp-1');
      expect(result).toEqual([]);
    });

    it('should recommend reorder when onHand <= reorderLevel', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Widget', sku: 'W1', reorderLevel: 10, reorderQuantity: 20, standardCost: 5, leadTimeDays: 7 },
      ]);
      mockLevelRepo.find.mockResolvedValue([
        { warehouseId: 'wh1', onHand: 5, movingAvgCost: 6 },
      ]);

      const result = await service.generateReorderRecommendations('comp-1');

      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe('i1');
      expect(result[0].currentStock).toBe(5);
      expect(result[0].reorderLevel).toBe(10);
      expect(result[0].recommendedQty).toBe(20);
      expect(result[0].unitCost).toBe(6);
      expect(result[0].estimatedCost).toBe(120);
      expect(result[0].leadTimeDays).toBe(7);
    });

    it('should not recommend when onHand > reorderLevel', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Widget', sku: 'W1', reorderLevel: 10, reorderQuantity: 20, standardCost: 5, leadTimeDays: 7 },
      ]);
      mockLevelRepo.find.mockResolvedValue([
        { warehouseId: 'wh1', onHand: 50, movingAvgCost: 6 },
      ]);

      const result = await service.generateReorderRecommendations('comp-1');
      expect(result).toEqual([]);
    });

    it('should apply overrideMultiplier to reorderQuantity', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Widget', sku: 'W1', reorderLevel: 5, reorderQuantity: 10, standardCost: 5, leadTimeDays: 3 },
      ]);
      mockLevelRepo.find.mockResolvedValue([
        { warehouseId: 'wh1', onHand: 0, movingAvgCost: 5 },
      ]);

      const result = await service.generateReorderRecommendations('comp-1', { overrideMultiplier: 2 } as any);

      expect(result[0].reorderQuantity).toBe(20);
      expect(result[0].estimatedCost).toBe(100);
    });

    it('should filter by itemId when provided in dto', async () => {
      mockItemRepo.findOne.mockResolvedValue({ id: 'i1', itemName: 'X', sku: 'S', reorderLevel: 5, reorderQuantity: 10, standardCost: 5, leadTimeDays: 3 });
      mockLevelRepo.find.mockResolvedValue([{ warehouseId: 'wh1', onHand: 0, movingAvgCost: 5 }]);

      const result = await service.generateReorderRecommendations('comp-1', { itemId: 'i1' } as any);

      expect(mockItemRepo.findOne).toHaveBeenCalledWith({ where: { id: 'i1', companyProfileId: 'comp-1' } });
      expect(result).toHaveLength(1);
    });

    it('should filter by warehouseId in levels when provided', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'X', sku: 'S', reorderLevel: 5, reorderQuantity: 10, standardCost: 5, leadTimeDays: 3 },
      ]);
      mockLevelRepo.find.mockResolvedValue([{ warehouseId: 'wh2', onHand: 0, movingAvgCost: 5 }]);

      const result = await service.generateReorderRecommendations('comp-1', { warehouseId: 'wh2' } as any);

      expect(mockLevelRepo.find).toHaveBeenCalledWith({ where: { itemId: 'i1', warehouseId: 'wh2' } });
      expect(result).toHaveLength(1);
    });

    it('should use standardCost when movingAvgCost is null', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'X', sku: 'S', reorderLevel: 5, reorderQuantity: 10, standardCost: 15, leadTimeDays: 3 },
      ]);
      mockLevelRepo.find.mockResolvedValue([{ warehouseId: 'wh1', onHand: 0, movingAvgCost: null }]);

      const result = await service.generateReorderRecommendations('comp-1');

      expect(result[0].unitCost).toBe(15);
    });
  });

  describe('findCriticalItems', () => {
    it('should return items with onHand <= 0', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Widget', sku: 'W1', reorderLevel: 10, reorderQuantity: 20, standardCost: 5, leadTimeDays: 7 },
      ]);
      mockLevelRepo.find.mockResolvedValue([
        { warehouseId: 'wh1', onHand: 0, movingAvgCost: 6 },
      ]);

      const result = await service.findCriticalItems('comp-1');

      expect(result).toHaveLength(1);
      expect(result[0].currentStock).toBe(0);
    });

    it('should not include items with positive stock', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Widget', sku: 'W1', reorderLevel: 10, reorderQuantity: 20, standardCost: 5, leadTimeDays: 7 },
      ]);
      mockLevelRepo.find.mockResolvedValue([
        { warehouseId: 'wh1', onHand: 5, movingAvgCost: 6 },
      ]);

      const result = await service.findCriticalItems('comp-1');
      expect(result).toEqual([]);
    });
  });

  describe('findDeadStock', () => {
    it('should return items not moved in > 90 days with positive stock', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 120);
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Old', sku: 'O1' },
      ]);
      mockLevelRepo.find.mockResolvedValue([
        { warehouseId: 'wh1', onHand: 10, totalValue: 100, lastMovementDate: oldDate },
      ]);

      const result = await service.findDeadStock('comp-1');

      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe('i1');
      expect(result[0].daysIdle).toBeGreaterThanOrEqual(119);
    });

    it('should not include items with zero stock', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 120);
      mockItemRepo.find.mockResolvedValue([{ id: 'i1', itemName: 'Old', sku: 'O1' }]);
      mockLevelRepo.find.mockResolvedValue([{ warehouseId: 'wh1', onHand: 0, totalValue: 0, lastMovementDate: oldDate }]);

      const result = await service.findDeadStock('comp-1');
      expect(result).toEqual([]);
    });

    it('should use custom daysThreshold', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 35);
      mockItemRepo.find.mockResolvedValue([{ id: 'i1', itemName: 'Recent', sku: 'R1' }]);
      mockLevelRepo.find.mockResolvedValue([{ warehouseId: 'wh1', onHand: 10, totalValue: 100, lastMovementDate: recentDate }]);

      // 35 days is < 90 default, so should NOT appear with default threshold
      const resultDefault = await service.findDeadStock('comp-1');
      expect(resultDefault).toEqual([]);

      // With threshold 30, 35 > 30 so it should appear
      const resultCustom = await service.findDeadStock('comp-1', 30);
      expect(resultCustom).toHaveLength(1);
    });
  });

  describe('findExcessStock', () => {
    it('should return items where onHand > 3x reorderLevel', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Excess', sku: 'E1', reorderLevel: 10 },
      ]);
      mockLevelRepo.find.mockResolvedValue([
        { warehouseId: 'wh1', onHand: 50, totalValue: 500 },
      ]);

      const result = await service.findExcessStock('comp-1');

      expect(result).toHaveLength(1);
      expect(result[0].excessQty).toBe(40);
    });

    it('should not include items where onHand <= 3x reorderLevel', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'Normal', sku: 'N1', reorderLevel: 10 },
      ]);
      mockLevelRepo.find.mockResolvedValue([
        { warehouseId: 'wh1', onHand: 30, totalValue: 300 },
      ]);

      const result = await service.findExcessStock('comp-1');
      expect(result).toEqual([]);
    });

    it('should not include items with 0 reorderLevel', async () => {
      mockItemRepo.find.mockResolvedValue([
        { id: 'i1', itemName: 'NoReorder', sku: 'NR1', reorderLevel: 0 },
      ]);
      mockLevelRepo.find.mockResolvedValue([
        { warehouseId: 'wh1', onHand: 100, totalValue: 1000 },
      ]);

      const result = await service.findExcessStock('comp-1');
      expect(result).toEqual([]);
    });
  });
});
