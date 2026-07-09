import { TaxNexusService } from './tax-nexus.service';

jest.mock('../entities/tax-jurisdiction-rule.entity');

describe('TaxNexusService', () => {
  let service: TaxNexusService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn() };
    service = new TaxNexusService(mockRepo);
  });

  // ─── registerNexus ──────────────────────────────────────────
  describe('registerNexus', () => {
    it('should create nexus with ruleType "Nexus"', async () => {
      const created = { id: 'n-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.registerNexus({
        countryCode: 'US',
        regionState: 'CA',
        nexusType: 'physical_presence',
      } as any);

      expect(result).toEqual(created);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        countryCode: 'US',
        regionState: 'CA',
        ruleType: 'Nexus',
        rateStandard: 0,
        rateReduced: 0,
        rateSuperReduced: 0,
      }));
    });

    it('should include threshold in sourceLawReference when provided', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.registerNexus({
        countryCode: 'US',
        nexusType: 'economic',
        thresholdAmount: 100000,
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.sourceLawReference).toContain('Threshold: 100000');
    });

    it('should not include threshold when not provided', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.registerNexus({
        countryCode: 'US',
        nexusType: 'physical_presence',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.sourceLawReference).not.toContain('Threshold');
    });

    it('should default active to true when not provided', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.registerNexus({
        countryCode: 'US',
        nexusType: 'physical_presence',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.active).toBe(true);
    });

    it('should use provided active value', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.registerNexus({
        countryCode: 'US',
        nexusType: 'physical_presence',
        active: false,
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.active).toBe(false);
    });

    it('should set effectiveDate from registrationDate when provided', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.registerNexus({
        countryCode: 'US',
        nexusType: 'physical_presence',
        registrationDate: '2026-01-15',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.effectiveDate).toBeInstanceOf(Date);
    });
  });

  // ─── findNexusByCountry ────────────────────────────────────
  describe('findNexusByCountry', () => {
    it('should return nexus rules filtered by country', async () => {
      const rules = [{ id: 'n-1', countryCode: 'US', ruleType: 'Nexus' }];
      mockRepo.find.mockResolvedValue(rules);

      const result = await service.findNexusByCountry('US');

      expect(result).toEqual(rules);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { countryCode: 'US', ruleType: 'Nexus' },
      });
    });

    it('should return empty array when no rules', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findNexusByCountry('XX');
      expect(result).toEqual([]);
    });
  });

  // ─── checkNexusObligation ──────────────────────────────────
  describe('checkNexusObligation', () => {
    it('should return hasNexus=false when no rules exist', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.checkNexusObligation('XX', 50000);

      expect(result.hasNexus).toBe(false);
    });

    it('should return hasNexus=true when sales exceed threshold', async () => {
      const rules = [{ sourceLawReference: 'Nexus: economic, Threshold: 100000' }];
      mockRepo.find.mockResolvedValue(rules);

      const result = await service.checkNexusObligation('US', 150000);

      expect(result.hasNexus).toBe(true);
      expect(result.threshold).toBe(100000);
    });

    it('should return hasNexus=false when sales below threshold', async () => {
      const rules = [{ sourceLawReference: 'Nexus: economic, Threshold: 100000' }];
      mockRepo.find.mockResolvedValue(rules);

      const result = await service.checkNexusObligation('US', 50000);

      expect(result.hasNexus).toBe(false);
      expect(result.threshold).toBe(100000);
    });

    it('should return hasNexus=true when threshold is 0', async () => {
      const rules = [{ sourceLawReference: 'Nexus: physical_presence' }];
      mockRepo.find.mockResolvedValue(rules);

      const result = await service.checkNexusObligation('US', 0);

      expect(result.hasNexus).toBe(true);
      expect(result.threshold).toBe(0);
    });
  });
});
