import { TaxJurisdictionService } from './tax-jurisdiction.service';

jest.mock('../entities/tax-jurisdiction-rule.entity');

describe('TaxJurisdictionService', () => {
  let service: TaxJurisdictionService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
    };
    service = new TaxJurisdictionService(mockRepo);
  });

  // ─── create ────────────────────────────────────────────────
  describe('create', () => {
    it('should create and return jurisdiction rule', async () => {
      const created = { id: 'r-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create({
        countryCode: 'US',
        ruleType: 'Standard',
        rateStandard: 0.07,
        effectiveDate: '2026-01-01',
      } as any);

      expect(result).toEqual(created);
      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.effectiveDate).toBeInstanceOf(Date);
    });

    it('should convert expirationDate string to Date when provided', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.create({
        countryCode: 'US',
        ruleType: 'Standard',
        rateStandard: 0.07,
        effectiveDate: '2026-01-01',
        expirationDate: '2026-12-31',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.expirationDate).toBeInstanceOf(Date);
    });

    it('should set expirationDate to undefined when not provided', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.create({
        countryCode: 'US',
        ruleType: 'Standard',
        rateStandard: 0.07,
        effectiveDate: '2026-01-01',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.expirationDate).toBeUndefined();
    });
  });

  // ─── findByCountry ─────────────────────────────────────────
  describe('findByCountry', () => {
    it('should return rules ordered by effectiveDate DESC', async () => {
      const rules = [{ id: 'r-1' }, { id: 'r-2' }];
      mockRepo.find.mockResolvedValue(rules);

      const result = await service.findByCountry('US');

      expect(result).toEqual(rules);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { countryCode: 'US' },
        order: { effectiveDate: 'DESC' },
      });
    });

    it('should return empty array when no rules', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findByCountry('XX');
      expect(result).toEqual([]);
    });
  });

  // ─── findActiveForLocation ─────────────────────────────────
  describe('findActiveForLocation', () => {
    it('should query with country and active=true filters', async () => {
      mockRepo.createQueryBuilder().getOne.mockResolvedValue({ id: 'r-1' });

      await service.findActiveForLocation({ countryCode: 'US' });

      expect(mockRepo.createQueryBuilder().where).toHaveBeenCalledWith(
        'rule.countryCode = :country', { country: 'US' }
      );
      expect(mockRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith(
        'rule.active = :active', { active: true }
      );
    });

    it('should filter by regionState when provided', async () => {
      mockRepo.createQueryBuilder().getOne.mockResolvedValue({ id: 'r-1' });

      await service.findActiveForLocation({ countryCode: 'US', regionState: 'CA' });

      expect(mockRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith(
        '(rule.regionState = :region OR rule.regionState IS NULL)', { region: 'CA' }
      );
    });

    it('should not filter by regionState when not provided', async () => {
      mockRepo.createQueryBuilder().getOne.mockResolvedValue(null);

      await service.findActiveForLocation({ countryCode: 'US' });

      const andWhereCalls = mockRepo.createQueryBuilder().andWhere.mock.calls;
      expect(andWhereCalls.find(c => c[0].includes('regionState'))).toBeUndefined();
    });

    it('should return null when no active rule found', async () => {
      mockRepo.createQueryBuilder().getOne.mockResolvedValue(null);

      const result = await service.findActiveForLocation({ countryCode: 'XX' });

      expect(result).toBeNull();
    });

    it('should apply limit 1', async () => {
      mockRepo.createQueryBuilder().getOne.mockResolvedValue({ id: 'r-1' });

      await service.findActiveForLocation({ countryCode: 'US' });

      expect(mockRepo.createQueryBuilder().limit).toHaveBeenCalledWith(1);
    });
  });

  // ─── update ────────────────────────────────────────────────
  describe('update', () => {
    it('should update and return updated rule', async () => {
      const updated = { id: 'r-1', rateStandard: 0.08 };
      mockRepo.findOne.mockResolvedValue(updated);

      const result = await service.update('r-1', { rateStandard: 0.08 });

      expect(result).toEqual(updated);
      expect(mockRepo.update).toHaveBeenCalledWith('r-1', { rateStandard: 0.08 });
    });

    it('should return null when rule not found after update', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.update('missing', { rateStandard: 0.08 });

      expect(result).toBeNull();
    });
  });
});
