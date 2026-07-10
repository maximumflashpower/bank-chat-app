import { SmbBankingService } from './smb-banking.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('../entities/smb-bank-account-linked.entity');

describe('SmbBankingService', () => {
  let service: SmbBankingService;
  let mockBankRepo: any;

  beforeEach(() => {
    mockBankRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn(), update: jest.fn() };
    service = new SmbBankingService(mockBankRepo);
  });

  describe('connectAccount', () => {
    it('should create account with connected status and autoReconciliation', async () => {
      const created = { id: 'acc-1' };
      mockBankRepo.create.mockReturnValue(created);
      mockBankRepo.save.mockResolvedValue(created);

      const result = await service.connectAccount({ institutionFinancialName: 'HSBC' } as any);

      expect(result).toEqual(created);
      const arg = mockBankRepo.create.mock.calls[0][0];
      expect(arg.connectionStatus).toBe('connected');
      expect(arg.autoReconciliationEnabled).toBe(true);
      expect(arg.institutionFinancialName).toBe('HSBC');
    });
  });

  describe('findAll', () => {
    it('should return all accounts', async () => {
      const accounts = [{ id: 'acc-1' }];
      mockBankRepo.find.mockResolvedValue(accounts);
      expect(await service.findAll()).toEqual(accounts);
    });
  });

  describe('findById', () => {
    it('should return account when found', async () => {
      const acc = { id: 'acc-1' };
      mockBankRepo.findOne.mockResolvedValue(acc);
      expect(await service.findById('acc-1')).toEqual(acc);
    });

    it('should return null when not found', async () => {
      mockBankRepo.findOne.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });
  });

  describe('importTransactions', () => {
    it('should update lastStatementImportTimestamp and increment count', async () => {
      const account = { id: 'acc-1', importedTransactionsCount: 5 };
      mockBankRepo.findOne.mockResolvedValue(account);

      const result = await service.importTransactions('acc-1');

      expect(result.imported).toBe(10);
      expect(result.duplicates).toBe(0);
      const arg = mockBankRepo.update.mock.calls[0][1];
      expect(arg.lastStatementImportTimestamp).toBeInstanceOf(Date);
      expect(arg.importedTransactionsCount).toBe(15);
    });

    it('should handle null importedTransactionsCount', async () => {
      mockBankRepo.findOne.mockResolvedValue({ id: 'acc-1', importedTransactionsCount: null });
      await service.importTransactions('acc-1');
      expect(mockBankRepo.update.mock.calls[0][1].importedTransactionsCount).toBe(10);
    });

    it('should throw NotFoundException when account not found', async () => {
      mockBankRepo.findOne.mockResolvedValue(null);
      await expect(service.importTransactions('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('autoMatch', () => {
    it('should return 0 matched and 0 unmatched by default', async () => {
      const result = await service.autoMatch('acc-1');
      expect(result.matched).toBe(0);
      expect(result.unmatched).toBe(0);
    });
  });

  describe('listUnmatched', () => {
    it('should return empty array by default', async () => {
      expect(await service.listUnmatched('acc-1')).toEqual([]);
    });
  });

  describe('cashForecast', () => {
    it('should return 90-day forecast with inflow/outflow/net', async () => {
      const result = await service.cashForecast('comp-1');

      expect(result.dailyBreakdown).toHaveLength(90);
      expect(result.projectedInflow).toBeGreaterThan(0);
      expect(result.projectedOutflow).toBeGreaterThan(0);
      expect(result.netPosition).toBe(result.projectedInflow - result.projectedOutflow);
    });

    it('should have valid date strings in dailyBreakdown', async () => {
      const result = await service.cashForecast('comp-1');
      expect(result.dailyBreakdown[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('aggregateMultiBank', () => {
    it('should aggregate balances from all accounts', async () => {
      mockBankRepo.find.mockResolvedValue([
        { id: 'a1', institutionFinancialName: 'HSBC', balanceRealtimeCurrentAvailable: 5000, connectionStatus: 'connected' },
        { id: 'a2', institutionFinancialName: 'BBVA', balanceRealtimeCurrentAvailable: 3000, connectionStatus: 'connected' },
      ]);

      const result = await service.aggregateMultiBank('comp-1');

      expect(result.totalAccounts).toBe(2);
      expect(result.totalBalance).toBe(8000);
      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0].institution).toBe('HSBC');
      expect(result.accounts[1].balance).toBe(3000);
    });

    it('should use Unknown when institutionFinancialName is null', async () => {
      mockBankRepo.find.mockResolvedValue([
        { id: 'a1', institutionFinancialName: null, balanceRealtimeCurrentAvailable: 100, connectionStatus: 'connected' },
      ]);

      const result = await service.aggregateMultiBank('comp-1');

      expect(result.accounts[0].institution).toBe('Unknown');
    });

    it('should handle null balanceRealtimeCurrentAvailable', async () => {
      mockBankRepo.find.mockResolvedValue([
        { id: 'a1', institutionFinancialName: 'HSBC', balanceRealtimeCurrentAvailable: null, connectionStatus: 'connected' },
      ]);

      const result = await service.aggregateMultiBank('comp-1');

      expect(result.totalBalance).toBe(0);
      expect(result.accounts[0].balance).toBe(0);
    });

    it('should return empty when no accounts', async () => {
      mockBankRepo.find.mockResolvedValue([]);
      const result = await service.aggregateMultiBank('comp-1');
      expect(result.totalAccounts).toBe(0);
      expect(result.totalBalance).toBe(0);
      expect(result.accounts).toEqual([]);
    });
  });
});
