import { TaxProductMappingService } from './tax-product-mapping.service';

jest.mock('../entities/tax-product-mapping.entity');

describe('TaxProductMappingService', () => {
  let service: TaxProductMappingService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn(), update: jest.fn() };
    service = new TaxProductMappingService(mockRepo);
  });

  // ─── findBySku ─────────────────────────────────────────────
  describe('findBySku', () => {
    it('should return mapping when found', async () => {
      const mapping = { id: 'm-1', productSku: 'SKU-001' };
      mockRepo.findOne.mockResolvedValue(mapping);

      const result = await service.findBySku('SKU-001');

      expect(result).toEqual(mapping);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { productSku: 'SKU-001' } });
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.findBySku('MISSING');
      expect(result).toBeNull();
    });
  });

  // ─── findByCountry ─────────────────────────────────────────
  describe('findByCountry', () => {
    it('should return mappings that include the country code', async () => {
      const all = [
        { id: 'm-1', countryCodes: ['US', 'CA'] },
        { id: 'm-2', countryCodes: ['MX'] },
      ];
      mockRepo.find.mockResolvedValue(all);

      const result = await service.findByCountry('US');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('m-1');
    });

    it('should return mappings with empty countryCodes (global)', async () => {
      const all = [
        { id: 'm-1', countryCodes: [] },
        { id: 'm-2', countryCodes: ['MX'] },
      ];
      mockRepo.find.mockResolvedValue(all);

      const result = await service.findByCountry('US');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('m-1');
    });

    it('should return mappings with null countryCodes', async () => {
      const all = [
        { id: 'm-1', countryCodes: null },
      ];
      mockRepo.find.mockResolvedValue(all);

      const result = await service.findByCountry('US');

      expect(result).toHaveLength(1);
    });

    it('should return all mappings with undefined countryCodes', async () => {
      const all = [
        { id: 'm-1', countryCodes: undefined },
      ];
      mockRepo.find.mockResolvedValue(all);

      const result = await service.findByCountry('US');

      expect(result).toHaveLength(1);
    });
  });

  // ─── create ────────────────────────────────────────────────
  describe('create', () => {
    it('should create and return mapping', async () => {
      const created = { id: 'm-1', productSku: 'SKU-001' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create({ productSku: 'SKU-001', taxCategory: 'STANDARD' });

      expect(result).toEqual(created);
      expect(mockRepo.create).toHaveBeenCalledWith({ productSku: 'SKU-001', taxCategory: 'STANDARD' });
    });
  });

  // ─── update ────────────────────────────────────────────────
  describe('update', () => {
    it('should update and return updated mapping', async () => {
      const updated = { id: 'm-1', taxCategory: 'REDUCED' };
      mockRepo.update.mockResolvedValue(undefined);
      mockRepo.findOne.mockResolvedValue(updated);

      const result = await service.update('m-1', { taxCategory: 'REDUCED' });

      expect(result).toEqual(updated);
      expect(mockRepo.update).toHaveBeenCalledWith('m-1', { taxCategory: 'REDUCED' });
    });

    it('should return null when mapping not found after update', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.update('missing', { taxCategory: 'REDUCED' });

      expect(result).toBeNull();
    });
  });
});
