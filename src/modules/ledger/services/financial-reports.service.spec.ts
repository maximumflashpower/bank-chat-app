import { FinancialReportsService } from './financial-reports.service';

jest.mock('../entities/ledger_journal_line.entity');
jest.mock('../entities/ledger_chart_of_accounts.entity');
jest.mock('../entities/ledger_journal_entry.entity');

describe('FinancialReportsService', () => {
  let service: FinancialReportsService;
  let mockLineRepo: any;
  let mockCoaRepo: any;
  let mockJeRepo: any;

  const mockQB = (rawResult: any[]) => ({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rawResult),
    getRawOne: jest.fn().mockResolvedValue({ period_id: 'period-1' }),
  });

  beforeEach(() => {
    mockLineRepo = { createQueryBuilder: jest.fn() };
    mockCoaRepo = { createQueryBuilder: jest.fn() };
    mockJeRepo = { createQueryBuilder: jest.fn() };
    service = new FinancialReportsService(mockLineRepo, mockCoaRepo, mockJeRepo);
  });

  // ─── trialBalance ───────────────────────────────────────────
  describe('trialBalance', () => {
    it('should map raw results to TrialBalanceRow format', async () => {
      const rawData = [
        { account_id: 'a1', account_code: '1000', account_name: 'Cash', account_type: 'asset', debit: '500', credit: '0' },
        { account_id: 'a2', account_code: '2000', account_name: 'AP', account_type: 'liability', debit: '0', credit: '300' },
      ];
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB(rawData));

      const result = await service.trialBalance('period-1');

      expect(result).toHaveLength(2);
      expect(result[0].account_code).toBe('1000');
      expect(result[0].debit).toBe(500);
      expect(result[0].credit).toBe(0);
      expect(result[0].balance).toBe(500);
      expect(result[1].balance).toBe(-300);
    });

    it('should handle empty results', async () => {
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB([]));
      const result = await service.trialBalance('empty-period');
      expect(result).toEqual([]);
    });

    it('should handle null numeric values as 0', async () => {
      const rawData = [
        { account_id: 'a1', account_code: '1000', account_name: 'Cash', account_type: 'asset', debit: null, credit: null },
      ];
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB(rawData));

      const result = await service.trialBalance('period-1');

      expect(result[0].debit).toBe(0);
      expect(result[0].credit).toBe(0);
      expect(result[0].balance).toBe(0);
    });
  });

  // ─── generalLedger ──────────────────────────────────────────
  describe('generalLedger', () => {
    it('should map raw results to GeneralLedgerRow format', async () => {
      const rawData = [
        { entry_number: 'JE-001', description: 'Sale', status: 'POSTED', effective_date: new Date('2026-01-01'), debit: '100', credit: '0', line_description: 'Cash sale' },
      ];
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB(rawData));

      const result = await service.generalLedger('acc-1', new Date('2026-01-01'), new Date('2026-12-31'));

      expect(result).toHaveLength(1);
      expect(result[0].entry_number).toBe('JE-001');
      expect(result[0].debit).toBe(100);
      expect(result[0].credit).toBe(0);
    });

    it('should handle empty results', async () => {
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB([]));
      const result = await service.generalLedger('acc-none', new Date(), new Date());
      expect(result).toEqual([]);
    });
  });

  // ─── balanceSheet ───────────────────────────────────────────
  describe('balanceSheet', () => {
    it('should categorize accounts by type and compute totals', async () => {
      const rawData = [
        { account_code: '1000', account_name: 'Cash', account_type: 'asset', normal_balance: 'DEBIT', debit_total: '500', credit_total: '0' },
        { account_code: '2000', account_name: 'AP', account_type: 'liability', normal_balance: 'CREDIT', debit_total: '0', credit_total: '300' },
        { account_code: '3000', account_name: 'Capital', account_type: 'equity', normal_balance: 'CREDIT', debit_total: '0', credit_total: '200' },
      ];
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB(rawData));

      const result = await service.balanceSheet(new Date());

      expect(result.assets).toBe(500); // 500 - 0
      expect(result.liabilities).toBe(300); // -(0 - 300) = 300
      expect(result.equity).toBe(200); // -(0 - 200) = 200
      expect(result.details.asset).toHaveLength(1);
      expect(result.details.liability).toHaveLength(1);
      expect(result.details.equity).toHaveLength(1);
    });

    it('should handle empty data', async () => {
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB([]));
      const result = await service.balanceSheet(new Date());
      expect(result.assets).toBe(0);
      expect(result.liabilities).toBe(0);
      expect(result.equity).toBe(0);
    });

    it('should use absolute balance in details', async () => {
      const rawData = [
        { account_code: '1000', account_name: 'Cash', account_type: 'asset', normal_balance: 'DEBIT', debit_total: '0', credit_total: '500' },
      ];
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB(rawData));

      const result = await service.balanceSheet(new Date());

      expect(result.details.asset[0].balance).toBe(500);
    });
  });

  // ─── incomeStatement ────────────────────────────────────────
  describe('incomeStatement', () => {
    it('should calculate revenue, expenses, and net income', async () => {
      const rawData = [
        { account_code: '4000', account_name: 'Sales', account_type: 'revenue', debit_total: '0', credit_total: '1000' },
        { account_code: '5000', account_name: 'Rent', account_type: 'expense', debit_total: '300', credit_total: '0' },
      ];
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB(rawData));

      const result = await service.incomeStatement(new Date('2026-01-01'), new Date('2026-12-31'));

      expect(result.revenue).toBe(1000);
      expect(result.expenses).toBe(300);
      expect(result.netIncome).toBe(700);
      expect(result.details.revenue).toHaveLength(1);
      expect(result.details.expense).toHaveLength(1);
    });

    it('should handle empty data', async () => {
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB([]));
      const result = await service.incomeStatement(new Date(), new Date());
      expect(result.revenue).toBe(0);
      expect(result.expenses).toBe(0);
      expect(result.netIncome).toBe(0);
    });
  });

  // ─── cashFlowStatement ─────────────────────────────────────
  describe('cashFlowStatement', () => {
    it('should categorize by account type', async () => {
      const rawData = [
        { account_code: '4000', account_name: 'Sales', account_type: 'revenue', debit_total: '0', credit_total: '1000' },
        { account_code: '1000', account_name: 'Equipment', account_type: 'asset', debit_total: '500', credit_total: '0' },
        { account_code: '3000', account_name: 'Loan', account_type: 'liability', debit_total: '0', credit_total: '200' },
      ];
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB(rawData));

      const result = await service.cashFlowStatement(new Date('2026-01-01'), new Date('2026-12-31'), 'direct');

      expect(result.method).toBe('direct');
      expect(result.operatingActivities).toBe(-1000); // 0 - 1000 (credit means negative for revenue)
      expect(result.investingActivities).toBe(-500); // -(500 - 0)
      expect(result.financingActivities).toBe(-200); // 0 - 200 = -200... wait
      expect(result.netCashFlow).toBe(result.operatingActivities + result.investingActivities + result.financingActivities);
    });

    it('should handle empty data', async () => {
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB([]));
      const result = await service.cashFlowStatement(new Date(), new Date(), 'indirect');
      expect(result.method).toBe('indirect');
      expect(result.netCashFlow).toBe(0);
    });
  });

  // ─── xbrlExport ────────────────────────────────────────────
  describe('xbrlExport', () => {
    it('should generate XBRL for balance-sheet', async () => {
      mockJeRepo.createQueryBuilder.mockReturnValue(mockQB([]));
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB([]));

      const result = await service.xbrlExport('balance-sheet', 'period-1');

      expect(result).toContain('<?xml');
      expect(result).toContain('<xbrl');
      expect(result).toContain('</xbrl>');
      expect(result).toContain('xbrl:assets');
    });

    it('should generate XBRL for income-statement', async () => {
      mockJeRepo.createQueryBuilder.mockReturnValue(mockQB([]));
      mockLineRepo.createQueryBuilder.mockReturnValue(mockQB([]));

      const result = await service.xbrlExport('income-statement', 'period-1');

      expect(result).toContain('<?xml');
      expect(result).toContain('xbrl:revenue');
      expect(result).toContain('xbrl:expenses');
      expect(result).toContain('xbrl:netIncome');
    });
  });
});
