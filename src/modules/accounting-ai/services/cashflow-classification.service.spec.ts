import { CashflowClassificationService } from './cashflow-classification.service';

jest.mock('../entities/cashflow-classification-log.entity');

describe('CashflowClassificationService', () => {
  let service: CashflowClassificationService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn() };
    service = new CashflowClassificationService(mockRepo);
  });

  describe('classify', () => {
    it('should classify salary as operating', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.classify('tx-1', 'Monthly salary payment', 5000);
      expect(mockRepo.create.mock.calls[0][0].classifiedCategory).toBe('operating');
    });

    it('should classify equipment as investing', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.classify('tx-2', 'Purchase of equipment', 10000);
      expect(mockRepo.create.mock.calls[0][0].classifiedCategory).toBe('investing');
    });

    it('should classify loan as financing', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.classify('tx-3', 'Loan repayment', 2000);
      expect(mockRepo.create.mock.calls[0][0].classifiedCategory).toBe('financing');
    });

    it('should default to operating for unknown keywords', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.classify('tx-4', 'Miscellaneous', 100);
      expect(mockRepo.create.mock.calls[0][0].classifiedCategory).toBe('operating');
    });

    it('should use higher confidence for descriptions > 10 chars', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.classify('tx-5', 'Salary payment for May', 5000);
      expect(mockRepo.create.mock.calls[0][0].mlPredictionConfidence).toBe(88.5);
    });

    it('should use lower confidence for descriptions <= 10 chars', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.classify('tx-6', 'Rent', 2000);
      expect(mockRepo.create.mock.calls[0][0].mlPredictionConfidence).toBe(72.0);
    });

    it('should set classificationMethod to AUTO_ML', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.classify('tx-7', 'Utilities', 500);
      expect(mockRepo.create.mock.calls[0][0].classificationMethod).toBe('AUTO_ML');
    });

    it('should set currencyOriginal to USD', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.classify('tx-8', 'Utilities payment', 500);
      expect(mockRepo.create.mock.calls[0][0].currencyOriginal).toBe('USD');
    });

    it('should store transactionId, counterpartyName, and amountOriginal', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.classify('tx-9', 'Property purchase', 50000);
      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.transactionId).toBe('tx-9');
      expect(arg.counterpartyName).toBe('Property purchase');
      expect(arg.amountOriginal).toBe(50000);
    });
  });

  describe('project', () => {
    it('should project balance with default 3 months', async () => {
      const result = await service.project({ currentBalance: 10000 } as any);
      // avgMonthlyFlow = 10000 * 0.1 = 1000
      // projectedBalance = 10000 + 1000 * 3 = 13000
      // inflow = 1000 * 3 * 0.6 = 1800
      // outflow = 1000 * 3 * 0.4 = 1200
      expect(result.projectedBalance).toBe(13000);
      expect(result.inflow).toBe(1800);
      expect(result.outflow).toBe(1200);
      expect(result.period).toBe('3M');
    });

    it('should use custom projectedPeriodMonths', async () => {
      const result = await service.project({ currentBalance: 10000, projectedPeriodMonths: 6 } as any);
      // avgMonthlyFlow = 1000, projectedBalance = 10000 + 6000 = 16000
      expect(result.projectedBalance).toBe(16000);
      expect(result.period).toBe('6M');
    });

    it('should handle zero balance', async () => {
      const result = await service.project({ currentBalance: 0 } as any);
      expect(result.projectedBalance).toBe(0);
      expect(result.inflow).toBe(0);
      expect(result.outflow).toBe(0);
    });
  });

  describe('listByCategory', () => {
    it('should filter by classifiedCategory', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.listByCategory('operating');
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { classifiedCategory: 'operating' } });
    });
  });
});
