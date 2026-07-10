import { SmbReceivableService } from './smb-receivable.service';

jest.mock('../entities/smb-invoice-document.entity');
jest.mock('../entities/smb-contact-party.entity');

describe('SmbReceivableService', () => {
  let service: SmbReceivableService;
  let mockInvoiceRepo: any;
  let mockContactRepo: any;

  beforeEach(() => {
    mockInvoiceRepo = { find: jest.fn(), update: jest.fn() };
    mockContactRepo = { findOne: jest.fn(), update: jest.fn() };
    service = new SmbReceivableService(mockInvoiceRepo, mockContactRepo);
  });

  describe('getAgingReport', () => {
    it('should bucket invoices by days overdue', async () => {
      const today = new Date();
      mockInvoiceRepo.find.mockResolvedValue([
        { remainingBalanceOwed: 100, dueDate: new Date(today.getTime() + 86400000) }, // future → current
        { remainingBalanceOwed: 50, dueDate: new Date(today.getTime() - 15 * 86400000) }, // 1_30
        { remainingBalanceOwed: 30, dueDate: new Date(today.getTime() - 45 * 86400000) }, // 31_60
        { remainingBalanceOwed: 20, dueDate: new Date(today.getTime() - 75 * 86400000) }, // 61_90
        { remainingBalanceOwed: 10, dueDate: new Date(today.getTime() - 100 * 86400000) }, // 90_plus
      ]);

      const result = await service.getAgingReport();

      expect(result.buckets.current).toBe(100);
      expect(result.buckets['1_30']).toBe(50);
      expect(result.buckets['31_60']).toBe(30);
      expect(result.buckets['61_90']).toBe(20);
      expect(result.buckets['90_plus']).toBe(10);
      expect(result.totalOutstanding).toBe(210);
    });

    it('should handle null remainingBalanceOwed', async () => {
      mockInvoiceRepo.find.mockResolvedValue([{ remainingBalanceOwed: null, dueDate: new Date() }]);
      const result = await service.getAgingReport();
      expect(result.buckets.current).toBe(0);
      expect(result.totalOutstanding).toBe(0);
    });

    it('should return zeros when no invoices', async () => {
      mockInvoiceRepo.find.mockResolvedValue([]);
      const result = await service.getAgingReport();
      expect(result.totalOutstanding).toBe(0);
    });
  });

  describe('getDSO', () => {
    it('should calculate DSO from receivables and daily sales', async () => {
      mockInvoiceRepo.find.mockResolvedValue([
        { remainingBalanceOwed: 300, grandTotalAmountDue: 900 },
      ]);

      const result = await service.getDSO();

      // avgDailySales = 900/30 = 30
      // dso = 300/30 = 10
      expect(result.totalReceivables).toBe(300);
      expect(result.averageDailySales).toBe(30);
      expect(result.dso).toBe(10);
    });

    it('should return dso 0 when no sales', async () => {
      mockInvoiceRepo.find.mockResolvedValue([]);
      const result = await service.getDSO();
      expect(result.dso).toBe(0);
      expect(result.totalReceivables).toBe(0);
      expect(result.averageDailySales).toBe(0);
    });
  });

  describe('manageCreditLimit', () => {
    it('should update customer credit limit', async () => {
      await service.manageCreditLimit('cust-1', 50000);
      expect(mockContactRepo.update).toHaveBeenCalledWith('cust-1', { creditLimitAssigned: 50000 });
    });
  });

  describe('getCustomerStatement', () => {
    it('should return statement with closing balance and transactions', async () => {
      mockInvoiceRepo.find.mockResolvedValue([
        { invoiceNumber: 'INV-1', issueDate: new Date('2026-01-01'), grandTotalAmountDue: 100, remainingBalanceOwed: 50, status: 'issued' },
      ]);
      mockContactRepo.findOne.mockResolvedValue({ id: 'cust-1', companyLegalName: 'Acme' });

      const result = await service.getCustomerStatement('cust-1');

      expect(result.customer).toEqual({ id: 'cust-1', companyLegalName: 'Acme' });
      expect(result.openingBalance).toBe(0);
      expect(result.closingBalance).toBe(50);
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].invoiceNumber).toBe('INV-1');
    });

    it('should handle null remainingBalanceOwed', async () => {
      mockInvoiceRepo.find.mockResolvedValue([{ invoiceNumber: 'INV-1', issueDate: new Date(), grandTotalAmountDue: 100, remainingBalanceOwed: null, status: 'issued' }]);
      mockContactRepo.findOne.mockResolvedValue({ id: 'cust-1' });
      const result = await service.getCustomerStatement('cust-1');
      expect(result.closingBalance).toBe(0);
    });
  });

  describe('writeOffBadDebt', () => {
    it('should set status to written_off and remaining to 0', async () => {
      await service.writeOffBadDebt('inv-1', 'uncollectible');
      expect(mockInvoiceRepo.update).toHaveBeenCalledWith('inv-1', { status: 'written_off', remainingBalanceOwed: 0 });
    });
  });
});
