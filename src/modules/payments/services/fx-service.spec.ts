import { FxService } from './fx-service';

describe('FxService', () => {
  let service: FxService;

  beforeEach(() => {
    service = new FxService();
  });

  describe('queryRate', () => {
    it('should return rate for USD to EUR', () => {
      const result = service.queryRate('USD', 'EUR', 1000);
      expect(result.rate).toBe(0.92);
      expect(result.convertedAmount).toBe(920);
      expect(result.provider).toBe('ProviderA');
      expect(result.spread).toBe(0.015);
    });

    it('should return rate for MXN to USD', () => {
      const result = service.queryRate('MXN', 'USD', 10000);
      expect(result.rate).toBe(0.058);
      expect(result.convertedAmount).toBe(580);
      expect(result.provider).toBe('ProviderA');
    });

    it('should return default rate 1 for unknown pair', () => {
      const result = service.queryRate('JPY', 'BRL', 5000);
      expect(result.rate).toBe(1);
      expect(result.convertedAmount).toBe(5000);
      expect(result.provider).toBe('DEFAULT');
      expect(result.spread).toBe(0.05);
    });

    it('should return default for same currency pair not in store', () => {
      const result = service.queryRate('XYZ', 'ABC', 100);
      expect(result.provider).toBe('DEFAULT');
    });
  });

  describe('convert', () => {
    it('should return conversion with rate and amounts', async () => {
      const result = await service.convert('USD', 'EUR', 1000, 'inst-1', 'user-1');

      expect(result.originalAmount).toBe(1000);
      expect(result.originalCurrency).toBe('USD');
      expect(result.convertedAmount).toBe(920);
      expect(result.convertedCurrency).toBe('EUR');
      expect(result.exchangeRate).toBe(0.92);
      expect(result.gainLoss).toBe(0);
    });

    it('should return default conversion for unknown pair', async () => {
      const result = await service.convert('XXX', 'YYY', 100, 'inst-2', 'user-2');

      expect(result.exchangeRate).toBe(1);
      expect(result.convertedAmount).toBe(100);
    });
  });

  describe('getExposureReport', () => {
    it('should return currencies with exposure data', async () => {
      const result = await service.getExposureReport();

      expect(result.currencies).toHaveLength(3);
      expect(result.currencies.find(c => c.currency === 'EUR')).toBeDefined();
      expect(result.currencies.find(c => c.currency === 'EUR').direction).toBe('LONG');
      expect(result.totalEquivalent).toBe(1200000);
      expect(result.riskScore).toBe(3.5);
    });
  });
});
