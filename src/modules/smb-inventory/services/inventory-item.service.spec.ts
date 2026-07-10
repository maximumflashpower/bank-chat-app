import { InventoryItemService } from './inventory-item.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('../entities/smb-inventory-item.entity');

describe('InventoryItemService', () => {
  let service: InventoryItemService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      }),
    };
    service = new InventoryItemService(mockRepo);
  });

  describe('create', () => {
    it('should create item with companyProfileId', async () => {
      const created = { id: 'item-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create('comp-1', { itemName: 'Widget', sku: 'W-001' } as any);
      expect(result).toEqual(created);
      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.companyProfileId).toBe('comp-1');
      expect(arg.itemName).toBe('Widget');
    });
  });

  describe('findAll', () => {
    it('should filter by companyProfileId', async () => {
      mockRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      await service.findAll('comp-1');
      expect(mockRepo.createQueryBuilder().where).toHaveBeenCalledWith('item.companyProfileId = :companyProfileId', { companyProfileId: 'comp-1' });
    });

    it('should apply category filter when provided', async () => {
      mockRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      await service.findAll('comp-1', { category: 'Electronics' });
      expect(mockRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('item.category = :category', { category: 'Electronics' });
    });

    it('should apply activeOnly filter when true', async () => {
      mockRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      await service.findAll('comp-1', { activeOnly: true });
      expect(mockRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('item.isActive = :isActive', { isActive: true });
    });

    it('should not apply activeOnly filter when false', async () => {
      mockRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      await service.findAll('comp-1', { activeOnly: false });
      expect(mockRepo.createQueryBuilder().andWhere).not.toHaveBeenCalledWith('item.isActive = :isActive', { isActive: true });
    });

    it('should return items from getMany', async () => {
      const items = [{ id: 'item-1' }];
      mockRepo.createQueryBuilder().getMany.mockResolvedValue(items);
      expect(await service.findAll('comp-1')).toEqual(items);
    });
  });

  describe('findById', () => {
    it('should return item when found', async () => {
      const item = { id: 'item-1' };
      mockRepo.findOne.mockResolvedValue(item);
      expect(await service.findById('item-1')).toEqual(item);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge dto into item and save', async () => {
      const item = { id: 'item-1', itemName: 'Old', isActive: true };
      mockRepo.findOne.mockResolvedValue(item);
      mockRepo.save.mockResolvedValue(item);

      const result = await service.update('item-1', { itemName: 'New' } as any);
      expect(result.itemName).toBe('New');
      expect(mockRepo.save).toHaveBeenCalledWith(item);
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false and save', async () => {
      const item = { id: 'item-1', isActive: true };
      mockRepo.findOne.mockResolvedValue(item);
      await service.deactivate('item-1');
      expect(item.isActive).toBe(false);
      expect(mockRepo.save).toHaveBeenCalledWith(item);
    });
  });

  describe('findByBarcode', () => {
    it('should find by barcode and companyProfileId', async () => {
      const item = { id: 'item-1' };
      mockRepo.findOne.mockResolvedValue(item);
      expect(await service.findByBarcode('BC-001', 'comp-1')).toEqual(item);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { barcode: 'BC-001', companyProfileId: 'comp-1' } });
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.findByBarcode('missing', 'comp-1')).toBeNull();
    });
  });

  describe('findBySku', () => {
    it('should find by sku and companyProfileId', async () => {
      const item = { id: 'item-1' };
      mockRepo.findOne.mockResolvedValue(item);
      expect(await service.findBySku('SKU-001', 'comp-1')).toEqual(item);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { sku: 'SKU-001', companyProfileId: 'comp-1' } });
    });
  });

  describe('findPerishableItems', () => {
    it('should filter by isPerishable and isActive', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.findPerishableItems('comp-1');
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { companyProfileId: 'comp-1', isPerishable: true, isActive: true } });
    });
  });

  describe('findSerialTrackedItems', () => {
    it('should filter by serialTrackingEnabled and isActive', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.findSerialTrackedItems('comp-1');
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { companyProfileId: 'comp-1', serialTrackingEnabled: true, isActive: true } });
    });
  });

  describe('findLotTrackedItems', () => {
    it('should filter by lotTrackingEnabled and isActive', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.findLotTrackedItems('comp-1');
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { companyProfileId: 'comp-1', lotTrackingEnabled: true, isActive: true } });
    });
  });
});
