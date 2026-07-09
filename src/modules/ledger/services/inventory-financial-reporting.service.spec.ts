import { InventoryFinancialReportingService } from './inventory-financial-reporting.service';

jest.mock('../entities/inventory-journal-link.entity');
jest.mock('../entities/ledger_journal_entry.entity');
jest.mock('../entities/ledger_journal_line.entity');

describe('InventoryFinancialReportingService', () => {
  let service: InventoryFinancialReportingService;
  let mockLinkRepo: any;
  let mockJeRepo: any;
  let mockLineRepo: any;

  beforeEach(() => {
    mockLinkRepo = { find: jest.fn() };
    mockJeRepo = { find: jest.fn() };
    mockLineRepo = { find: jest.fn() };
    service = new InventoryFinancialReportingService(mockLinkRepo, mockJeRepo, mockLineRepo);
  });

  // ─── generateFinancialReport ────────────────────────────────
  describe('generateFinancialReport', () => {
    it('should return report with totals when links exist', async () => {
      const links = [
        {
          companyProfileId: 'cp-1',
          journalEntry: {
            total_debit: 500,
            createdAt: new Date('2026-01-15'),
          },
        },
        {
          companyProfileId: 'cp-1',
          journalEntry: {
            total_debit: 300,
            createdAt: new Date('2026-02-20'),
          },
        },
      ];
      mockLinkRepo.find.mockResolvedValue(links);

      const result = await service.generateFinancialReport({
        companyProfileId: 'cp-1',
      });

      expect(result.totalPostedValue).toBe(800);
      expect(result.totalTransactions).toBe(2);
      expect(result.byMovementType).toHaveLength(1);
      expect(result.byPeriod).toHaveLength(2);
    });

    it('should filter by companyProfileId', async () => {
      const links = [
        {
          companyProfileId: 'cp-1',
          journalEntry: { total_debit: 500, createdAt: new Date('2026-01-15') },
        },
        {
          companyProfileId: 'cp-2',
          journalEntry: { total_debit: 1000, createdAt: new Date('2026-01-15') },
        },
      ];
      mockLinkRepo.find.mockResolvedValue(links);

      const result = await service.generateFinancialReport({
        companyProfileId: 'cp-1',
      });

      expect(result.totalTransactions).toBe(1);
      expect(result.totalPostedValue).toBe(500);
    });

    it('should filter by date range', async () => {
      const links = [
        {
          companyProfileId: 'cp-1',
          journalEntry: { total_debit: 500, createdAt: new Date('2026-01-15') },
        },
        {
          companyProfileId: 'cp-1',
          journalEntry: { total_debit: 300, createdAt: new Date('2026-06-01') },
        },
      ];
      mockLinkRepo.find.mockResolvedValue(links);

      const result = await service.generateFinancialReport({
        companyProfileId: 'cp-1',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      });

      expect(result.totalTransactions).toBe(1);
      expect(result.totalPostedValue).toBe(500);
    });

    it('should return empty report when no links', async () => {
      mockLinkRepo.find.mockResolvedValue([]);

      const result = await service.generateFinancialReport({});

      expect(result.totalPostedValue).toBe(0);
      expect(result.totalTransactions).toBe(0);
      expect(result.byMovementType).toEqual([]);
      expect(result.byPeriod).toEqual([]);
    });

    it('should group by period correctly', async () => {
      const links = [
        {
          companyProfileId: 'cp-1',
          journalEntry: { total_debit: 100, createdAt: new Date('2026-01-10') },
        },
        {
          companyProfileId: 'cp-1',
          journalEntry: { total_debit: 200, createdAt: new Date('2026-01-25') },
        },
        {
          companyProfileId: 'cp-1',
          journalEntry: { total_debit: 50, createdAt: new Date('2026-02-10') },
        },
      ];
      mockLinkRepo.find.mockResolvedValue(links);

      const result = await service.generateFinancialReport({});

      expect(result.byPeriod).toHaveLength(2);
      const janPeriod = result.byPeriod.find(p => p.period === '2026-01');
      expect(janPeriod.value).toBe(300);
      const febPeriod = result.byPeriod.find(p => p.period === '2026-02');
      expect(febPeriod.value).toBe(50);
    });
  });

  // ─── getInventoryAssetBalance ───────────────────────────────
  describe('getInventoryAssetBalance', () => {
    it('should return 0 (stub implementation)', async () => {
      const result = await service.getInventoryAssetBalance('cp-1');
      expect(result).toBe(0);
    });
  });

  // ─── getCOGSTotal ───────────────────────────────────────────
  describe('getCOGSTotal', () => {
    it('should return 0 (stub implementation)', async () => {
      const result = await service.getCOGSTotal('2026-01-01', '2026-12-31');
      expect(result).toBe(0);
    });
  });
});
