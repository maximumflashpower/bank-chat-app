import { FXTellerService } from './fx-teller.service';
import { TellerTransactionType, TellerTransactionStatus } from '../entities/teller-transaction.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('FXTellerService', () => {
  let service: FXTellerService;
  let transactionRepo: any;

  beforeEach(() => {
    transactionRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new FXTellerService(transactionRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRate', () => {
    it('should return rate for USD-EUR', async () => {
      const result = await service.getRate('USD', 'EUR');
      expect(result.fromCurrency).toBe('USD');
      expect(result.toCurrency).toBe('EUR');
      expect(result.rate).toBe(0.92);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should return rate for MXN-USD', async () => {
      const result = await service.getRate('MXN', 'USD');
      expect(result.rate).toBe(0.058);
    });

    it('should calculate inverse rate when direct pair not found', async () => {
      // JPY-EUR not in map, but JPY-USD exists (0.00669) and USD-EUR exists (0.92)
      // However the service only tries the reverse pair, not cross rates
      // So let's use a pair where only the reverse exists
      // CAD-EUR doesn't exist, EUR-CAD doesn't exist either...
      // Let's try USD-CAD (exists as 1.36) - direct, so that works
      // We need a pair where direct doesn't exist but reverse does
      // USD-CAD exists (1.36), CAD-USD exists (0.735) - both direct
      // Hmm, all pairs seem to have both directions...
      // Let's check: EUR-GBP exists (0.86) and GBP-EUR exists (1.163) - both direct
      // JPZ-USZ won't exist in either direction
      // Actually, the service tries reverse: if ABC-DEF doesn't exist, try DEF-ABC and invert
      // So we need a pair where the forward doesn't exist but reverse does
      // All pairs in the map have both directions listed!
      // So inverse never triggers with the current data set.
      // Test with a pair that has only one direction by using setCustomRate first
      await service.setCustomRate('USD', 'AUD', 1.48, 'admin-1');
      // Now AUD-USD doesn't exist, but USD-AUD does
      const result = await service.getRate('AUD', 'USD');
      expect(result.rate).toBeCloseTo(1 / 1.48, 4);
    });

    it('should be case insensitive', async () => {
      const result = await service.getRate('usd', 'eur');
      expect(result.fromCurrency).toBe('USD');
      expect(result.toCurrency).toBe('EUR');
      expect(result.rate).toBe(0.92);
    });

    it('should throw BadRequestException for unsupported pair', async () => {
      await expect(service.getRate('XYZ', 'ABC')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllRates', () => {
    it('should return all available rates sorted', async () => {
      const result = await service.getAllRates();
      expect(result.length).toBeGreaterThanOrEqual(12);
      const cadIdx = result.findIndex(r => r.fromCurrency === 'CAD' && r.toCurrency === 'USD');
      const eurGbpIdx = result.findIndex(r => r.fromCurrency === 'EUR' && r.toCurrency === 'GBP');
      expect(cadIdx).toBeLessThan(eurGbpIdx);
    });
  });

  describe('calculateExchange', () => {
    it('should calculate exchange with commission', async () => {
      const result = await service.calculateExchange({
        amountFrom: 1000,
        currencyFrom: 'USD',
        currencyTo: 'EUR',
      });
      expect(result.rate).toBe(0.92);
      expect(result.amountTo).toBe(920);
      expect(result.commission).toBeCloseTo(2.3, 2);
      expect(result.total).toBeCloseTo(922.3, 2);
    });

    it('should calculate for MXN to USD', async () => {
      const result = await service.calculateExchange({
        amountFrom: 10000,
        currencyFrom: 'MXN',
        currencyTo: 'USD',
      });
      expect(result.rate).toBe(0.058);
      expect(result.amountTo).toBe(580);
      expect(result.commission).toBeCloseTo(1.45, 2);
    });
  });

  describe('executeExchange', () => {
    const baseDto = {
      amountFrom: 5000,
      currencyFrom: 'USD',
      currencyTo: 'EUR',
      exchangeRate: 0.92,
      sourceAccountId: 'src-1',
      destinationAccountId: 'dst-1',
      branchId: 'b1',
      tellerUserId: 't1',
      customerId: 'c1',
    };

    it('should execute FX exchange successfully', async () => {
      transactionRepo.create.mockImplementation((data: any) => ({ ...data }));
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.executeExchange(baseDto as any);
      expect(result.transactionType).toBe(TellerTransactionType.FOREIGN_EXCHANGE);
      expect(result.amountPrincipal).toBe(5000);
      expect(result.foreignExchangeRate).toBe(0.92);
      expect(result.transactionStatus).toBe(TellerTransactionStatus.PENDING);
      expect(result.receiptPrinted).toBe(false);
      expect(result.branchId).toBe('b1');
      expect(result.tellerUserId).toBe('t1');
      expect(result.customerId).toBe('c1');
      expect(result.transactionReference).toMatch(/^FX-\d{6}-\d{4}$/);
    });

    it('should set overrideRequired when amount exceeds $25,000', async () => {
      transactionRepo.create.mockImplementation((data: any) => ({ ...data }));
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.executeExchange({
        ...baseDto, amountFrom: 30000, exchangeRate: 0.92,
      } as any);
      expect(result.overrideRequired).toBe(true);
    });

    it('should not set overrideRequired when amount is under $25,000', async () => {
      transactionRepo.create.mockImplementation((data: any) => ({ ...data }));
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.executeExchange({
        ...baseDto, amountFrom: 20000, exchangeRate: 0.92,
      } as any);
      expect(result.overrideRequired).toBe(false);
    });

    it('should include commission in totalAmount when provided', async () => {
      transactionRepo.create.mockImplementation((data: any) => ({ ...data }));
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.executeExchange({
        ...baseDto, commissionAmount: 50,
      } as any);
      expect(result.feeCharged).toBe(50);
      expect(result.totalAmount).toBe(5050);
    });

    it('should default commission to 0 when not provided', async () => {
      transactionRepo.create.mockImplementation((data: any) => ({ ...data }));
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.executeExchange(baseDto as any);
      expect(result.feeCharged).toBe(0);
      expect(result.totalAmount).toBe(5000);
    });

    it('should throw BadRequestException for unsupported currency pair', async () => {
      await expect(
        service.executeExchange({ ...baseDto, currencyFrom: 'XYZ', currencyTo: 'ABC' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmExchange', () => {
    it('should confirm exchange with ledger entry and actual rate', async () => {
      const mockTx = {
        id: 'tx1',
        transactionReference: 'FX-202607-0001',
        transactionStatus: TellerTransactionStatus.PENDING,
      };
      transactionRepo.findOne.mockResolvedValue(mockTx);
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.confirmExchange('tx1', {
        ledgerJournalEntryId: 'je-1',
        actualRateUsed: 0.915,
      });
      expect(result.transactionStatus).toBe(TellerTransactionStatus.COMPLETED);
      expect(result.ledgerJournalEntryId).toBe('je-1');
      expect(result.foreignExchangeRate).toBe(0.915);
      expect(result.receiptPrinted).toBe(true);
      expect(result.processedAt).toBeInstanceOf(Date);
    });

    it('should confirm exchange without optional fields', async () => {
      const mockTx = {
        id: 'tx1',
        transactionReference: 'FX-202607-0001',
        transactionStatus: TellerTransactionStatus.PENDING,
        foreignExchangeRate: 0.92,
      };
      transactionRepo.findOne.mockResolvedValue(mockTx);
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.confirmExchange('tx1', {});
      expect(result.transactionStatus).toBe(TellerTransactionStatus.COMPLETED);
      expect(result.foreignExchangeRate).toBe(0.92);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      transactionRepo.findOne.mockResolvedValue(null);
      await expect(service.confirmExchange('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('reverseExchange', () => {
    it('should reverse a completed exchange', async () => {
      transactionRepo.findOne.mockResolvedValue({
        id: 'tx1',
        transactionReference: 'FX-202607-0001',
        transactionStatus: 'completed',
      });
      transactionRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.reverseExchange('tx1', 'Rate error', 'admin-1');
      expect(result.transactionStatus).toBe(TellerTransactionStatus.REVERSED);
      expect(result.reversalReason).toBe('Rate error');
      expect(result.overrideApprovedBy).toBe('admin-1');
    });

    it('should throw BadRequestException when transaction is not completed', async () => {
      transactionRepo.findOne.mockResolvedValue({
        id: 'tx1',
        transactionStatus: 'pending',
      });
      await expect(
        service.reverseExchange('tx1', 'reason', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      transactionRepo.findOne.mockResolvedValue(null);
      await expect(
        service.reverseExchange('nonexistent', 'reason', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setCustomRate', () => {
    it('should set a custom rate and return old rate', async () => {
      const result = await service.setCustomRate('USD', 'EUR', 0.95, 'admin-1');
      expect(result.oldRate).toBe(0.92);
      expect(result.newRate).toBe(0.95);
      expect(result.setBy).toBe('admin-1');
    });

    it('should set a new rate for a pair that did not exist', async () => {
      const result = await service.setCustomRate('USD', 'AUD', 1.48, 'admin-1');
      expect(result.oldRate).toBeNull();
      expect(result.newRate).toBe(1.48);
    });

    it('should throw BadRequestException when rate is zero or negative', async () => {
      await expect(service.setCustomRate('USD', 'EUR', 0, 'admin-1'))
        .rejects.toThrow(BadRequestException);
      await expect(service.setCustomRate('USD', 'EUR', -1, 'admin-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('resetRate', () => {
    it('should reset an existing custom rate', async () => {
      await service.setCustomRate('USD', 'AUD', 1.48, 'admin-1');
      const result = await service.resetRate('USD', 'AUD');
      expect(result.wasCustom).toBe(true);
    });

    it('should return wasCustom=false for non-existent pair', async () => {
      const result = await service.resetRate('USD', 'ZZZ');
      expect(result.wasCustom).toBe(false);
    });
  });
});
