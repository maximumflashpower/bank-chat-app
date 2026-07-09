import { TaxCalculationService } from './tax-calculation.service';

jest.mock('../entities/tax-calculation-result.entity');

describe('TaxCalculationService', () => {
  let service: TaxCalculationService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn() };
    service = new TaxCalculationService(mockRepo);
  });

  // ─── calculate ──────────────────────────────────────────────
  describe('calculate', () => {
    it('should calculate tax with exclusive method (default 16%)', async () => {
      const created = { id: 'tc-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.calculate({
        taxableAmount: 1000,
        calculationMethod: 'exclusive',
        currency: 'USD',
      } as any);

      expect(result).toEqual(created);
      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.taxAmount).toBe(160);
      expect(createArg.totalAmount).toBe(1160);
      expect(createArg.appliedRate).toBe(0.16);
    });

    it('should calculate tax with included method', async () => {
      const created = { id: 'tc-2' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.calculate({
        taxableAmount: 1000,
        calculationMethod: 'included',
        currency: 'USD',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.appliedRate).toBeCloseTo(0.16 / 1.16, 5);
      expect(createArg.taxAmount).toBeCloseTo(1000 * (0.16 / 1.16), 2);
      expect(createArg.totalAmount).toBeCloseTo(1000 + 1000 * (0.16 / 1.16), 2);
    });

    it('should default to 0.16 rate when calculationMethod is not "included"', async () => {
      const created = { id: 'tc-3' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      await service.calculate({
        taxableAmount: 500,
        currency: 'MXN',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.appliedRate).toBe(0.16);
      expect(createArg.taxAmount).toBe(80);
    });

    it('should spread dto fields into create call', async () => {
      const created = { id: 'tc-4' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      await service.calculate({
        taxableAmount: 1000,
        calculationMethod: 'exclusive',
        currency: 'USD',
        customerId: 'cust-1',
        transactionId: 'tx-1',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.customerId).toBe('cust-1');
      expect(createArg.transactionId).toBe('tx-1');
    });
  });

  // ─── determineApplicableRate ────────────────────────────────
  describe('determineApplicableRate', () => {
    it('should return 0.16 for exclusive method', async () => {
      const rate = await service.determineApplicableRate({
        taxableAmount: 1000,
        calculationMethod: 'exclusive',
      } as any);
      expect(rate).toBe(0.16);
    });

    it('should return baseRate/(1+baseRate) for included method', async () => {
      const rate = await service.determineApplicableRate({
        taxableAmount: 1000,
        calculationMethod: 'included',
      } as any);
      expect(rate).toBeCloseTo(0.16 / 1.16, 5);
    });

    it('should return 0.16 when calculationMethod is undefined', async () => {
      const rate = await service.determineApplicableRate({
        taxableAmount: 1000,
      } as any);
      expect(rate).toBe(0.16);
    });
  });

  // ─── findById ──────────────────────────────────────────────
  describe('findById', () => {
    it('should return calculation when found', async () => {
      const calc = { id: 'tc-1', taxAmount: 160 };
      mockRepo.findOne.mockResolvedValue(calc);

      const result = await service.findById('tc-1');

      expect(result).toEqual(calc);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'tc-1' } });
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.findById('missing');
      expect(result).toBeNull();
    });
  });

  // ─── findByTransaction ──────────────────────────────────────
  describe('findByTransaction', () => {
    it('should return calculations for a transaction', async () => {
      const calcs = [{ id: 'tc-1' }, { id: 'tc-2' }];
      mockRepo.find.mockResolvedValue(calcs);

      const result = await service.findByTransaction('tx-1');

      expect(result).toEqual(calcs);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { transactionId: 'tx-1' } });
    });

    it('should return empty array when no calculations found', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findByTransaction('tx-none');
      expect(result).toEqual([]);
    });
  });
});
