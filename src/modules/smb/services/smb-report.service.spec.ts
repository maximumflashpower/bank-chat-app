import { SmbReportService } from './smb-report.service';

jest.mock('../entities/smb-invoice-document.entity');
jest.mock('../entities/smb-contact-party.entity');

describe('SmbReportService', () => {
  let service: SmbReportService;
  let mockInvoiceRepo: any;
  let mockContactRepo: any;

  beforeEach(() => {
    mockInvoiceRepo = { find: jest.fn() };
    mockContactRepo = { find: jest.fn() };
    service = new SmbReportService(mockInvoiceRepo, mockContactRepo);
  });

  describe('trialBalance', () => {
    it('should return accounts with totalDebit equal to totalCredit', async () => {
      const result = await service.trialBalance();
      expect(result.accounts.length).toBeGreaterThan(0);
      expect(result.totalDebit).toBe(result.totalCredit);
    });
  });

  describe('profitLoss', () => {
    it('should calculate revenue from non-draft non-credit_note invoices', async () => {
      mockInvoiceRepo.find.mockResolvedValue([
        { subtotalNetAmount: 100, status: 'issued' },
        { subtotalNetAmount: 200, status: 'full_paid' },
        { subtotalNetAmount: 50, status: 'draft' },
        { subtotalNetAmount: 30, status: 'credit_note' },
      ]);

      const result = await service.profitLoss();

      expect(result.revenue).toBe(300); // 100 + 200
      expect(result.cogs).toBe(180); // 300 * 0.6
      expect(result.grossProfit).toBe(120); // 300 * 0.4
      expect(result.netIncome).toBe(60); // 300 * 0.2
    });

    it('should return zeros when no invoices', async () => {
      mockInvoiceRepo.find.mockResolvedValue([]);
      const result = await service.profitLoss();
      expect(result.revenue).toBe(0);
      expect(result.cogs).toBe(0);
    });
  });

  describe('balanceSheet', () => {
    it('should return balanced sheet with assets = liabilities + equity', async () => {
      const result = await service.balanceSheet();
      expect(result.totalAssets).toBe(result.totalLiabilities + result.totalEquity);
      expect(result.assets.length).toBeGreaterThan(0);
      expect(result.liabilities.length).toBeGreaterThan(0);
      expect(result.equity.length).toBeGreaterThan(0);
    });
  });

  describe('cashFlowStatement', () => {
    it('should return operating, investing, financing activities', async () => {
      const result = await service.cashFlowStatement();
      expect(result.operatingActivities).toBe(15000);
      expect(result.investingActivities).toBe(-5000);
      expect(result.financingActivities).toBe(-2000);
      expect(result.netChange).toBe(8000);
    });
  });

  describe('profitabilityAnalysis', () => {
    it('should return per-customer profitability', async () => {
      mockContactRepo.find.mockResolvedValue([{ id: 'c1', companyLegalName: 'Acme', partyType: 'customer' }]);
      mockInvoiceRepo.find.mockResolvedValue([
        { customerId: 'c1', subtotalNetAmount: 200 },
      ]);

      const result = await service.profitabilityAnalysis();

      expect(result).toHaveLength(1);
      expect(result[0].customer).toBe('Acme');
      expect(result[0].revenue).toBe(200);
      expect(result[0].cost).toBe(120); // 200 * 0.6
      expect(result[0].profit).toBe(80);
      expect(result[0].margin).toBe(40); // 80/200 * 100
    });

    it('should return 0 margin for zero revenue', async () => {
      mockContactRepo.find.mockResolvedValue([{ id: 'c1', companyLegalName: 'Empty', partyType: 'customer' }]);
      mockInvoiceRepo.find.mockResolvedValue([]);

      const result = await service.profitabilityAnalysis();

      expect(result[0].revenue).toBe(0);
      expect(result[0].margin).toBe(0);
    });

    it('should return empty array when no customers', async () => {
      mockContactRepo.find.mockResolvedValue([]);
      mockInvoiceRepo.find.mockResolvedValue([]);
      const result = await service.profitabilityAnalysis();
      expect(result).toEqual([]);
    });
  });

  describe('budgetVsActual', () => {
    it('should return categories with budget, actual, and variance', async () => {
      const result = await service.budgetVsActual();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('budget');
      expect(result[0]).toHaveProperty('actual');
      expect(result[0]).toHaveProperty('variance');
    });
  });

  describe('financialHealthScore', () => {
    it('should return score and sub-scores', async () => {
      const result = await service.financialHealthScore();
      expect(result.score).toBe(78);
      expect(result.liquidity).toBe(82);
      expect(result.profitability).toBe(75);
      expect(result.efficiency).toBe(70);
      expect(result.leverage).toBe(65);
    });
  });

  describe('cashBurnRunway', () => {
    it('should return burn rate and runway months', async () => {
      const result = await service.cashBurnRunway();
      expect(result.monthlyBurn).toBe(12000);
      expect(result.runwayMonths).toBe(7.5);
      expect(result.cashOnHand).toBe(90000);
    });
  });
});
