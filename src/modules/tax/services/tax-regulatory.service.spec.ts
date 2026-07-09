import { TaxRegulatoryService } from './tax-regulatory.service';

jest.mock('../entities/tax-jurisdiction-rule.entity');

describe('TaxRegulatoryService', () => {
  let service: TaxRegulatoryService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { find: jest.fn() };
    service = new TaxRegulatoryService(mockRepo);
  });

  describe('recordRegulatoryChange', () => {
    it('should record change without throwing', async () => {
      await expect(service.recordRegulatoryChange({
        countryCode: 'US',
        effectiveDate: new Date(),
        oldRate: 0.07,
        newRate: 0.08,
        lawReference: 'Pub. L. 117-123',
      })).resolves.toBeUndefined();
    });
  });

  describe('getHistoricalChanges', () => {
    it('should return changes filtered by countryCode', async () => {
      await service.recordRegulatoryChange({
        countryCode: 'US',
        effectiveDate: new Date(),
        oldRate: 0.07,
        newRate: 0.08,
        lawReference: 'Law A',
      });
      await service.recordRegulatoryChange({
        countryCode: 'MX',
        effectiveDate: new Date(),
        oldRate: 0.16,
        newRate: 0.18,
        lawReference: 'Law B',
      });

      const result = await service.getHistoricalChanges('US');

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every(c => c.countryCode === 'US')).toBe(true);
    });

    it('should return empty array when no changes for country', async () => {
      const result = await service.getHistoricalChanges('XX');
      expect(result).toEqual([]);
    });
  });

  describe('getCurrentRate', () => {
    it('should return rateStandard when active rule exists', async () => {
      mockRepo.find.mockResolvedValue([
        { rateStandard: 0.16, effectiveDate: new Date('2026-01-01'), expirationDate: null, active: true },
      ]);

      const result = await service.getCurrentRate('MX', 'Standard');

      expect(result).toBe(0.16);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { countryCode: 'MX', ruleType: 'Standard', active: true },
        order: { effectiveDate: 'DESC' },
      });
    });

    it('should return 0 when no rules found', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.getCurrentRate('XX', 'Standard');

      expect(result).toBe(0);
    });

    it('should return 0 when rule is expired', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      mockRepo.find.mockResolvedValue([
        { rateStandard: 0.16, effectiveDate: new Date('2020-01-01'), expirationDate: pastDate, active: true },
      ]);

      const result = await service.getCurrentRate('MX', 'Standard');

      expect(result).toBe(0);
    });

    it('should skip future-effective rules', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockRepo.find.mockResolvedValue([
        { rateStandard: 0.20, effectiveDate: futureDate, expirationDate: null, active: true },
      ]);

      const result = await service.getCurrentRate('MX', 'Standard');

      expect(result).toBe(0);
    });
  });

  describe('assessImpact', () => {
    it('should calculate deltaTax and percentageIncrease', async () => {
      const result = await service.assessImpact(0.10, 0.15, 10000);

      expect(result.deltaTax).toBe(500);
      expect(result.percentageIncrease).toBeCloseTo(50, 5);
    });

    it('should return negative deltaTax when rate decreases', async () => {
      const result = await service.assessImpact(0.15, 0.10, 10000);

      expect(result.deltaTax).toBe(-500);
      expect(result.percentageIncrease).toBeCloseTo(-33.33, 1);
    });

    it('should return 0 percentageIncrease when oldRate is 0', async () => {
      const result = await service.assessImpact(0, 0.15, 10000);

      expect(result.deltaTax).toBe(1500);
      expect(result.percentageIncrease).toBe(0);
    });

    it('should return 0 deltaTax when rates are equal', async () => {
      const result = await service.assessImpact(0.10, 0.10, 10000);

      expect(result.deltaTax).toBe(0);
      expect(result.percentageIncrease).toBe(0);
    });
  });
});
