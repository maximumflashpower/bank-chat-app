import { PaymentReconciliationService } from './payment-reconciliation.service';

jest.mock('../entities/pay-reconciliation-entry.entity');

describe('PaymentReconciliationService', () => {
  let service: PaymentReconciliationService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { save: jest.fn(), findOne: jest.fn() };
    service = new PaymentReconciliationService(mockRepo);
  });

  describe('autoReconcile', () => {
    it('should return 0 matched and 0 unmatched when no pending statements', async () => {
      const result = await service.autoReconcile({
        fromDate: '2026-01-01', toDate: '2026-01-31', accountId: 'acc-1',
      } as any);

      expect(result.matched).toBe(0);
      expect(result.unmatched).toBe(0);
    });
  });

  describe('listUnmatched', () => {
    it('should return empty array by default', async () => {
      const result = await service.listUnmatched();
      expect(result).toEqual([]);
    });
  });

  describe('manualMatch', () => {
    it('should save reconciliation entry with manual match data', async () => {
      await service.manualMatch({
        statementLineId: 'sl-1',
        instructionId: 'inst-1',
        customerId: 'cust-1',
        invoiceNumbers: 'INV-001',
        adjustedBy: 'user-1',
      } as any);

      const arg = mockRepo.save.mock.calls[0][0];
      expect(arg.bankStatementLineId).toBe('sl-1');
      expect(arg.matchedInstructionIds).toEqual(['inst-1']);
      expect(arg.matchedCustomerId).toBe('cust-1');
      expect(arg.matchedInvoiceNumbers).toEqual(['INV-001']);
      expect(arg.autoMatched).toBe(false);
      expect(arg.manuallyAdjustedBy).toBe('user-1');
      expect(arg.adjustedAt).toBeInstanceOf(Date);
      expect(arg.clearedTransitAccount).toBe(true);
    });

    it('should handle missing invoiceNumbers', async () => {
      await service.manualMatch({
        statementLineId: 'sl-2',
        instructionId: 'inst-2',
        adjustedBy: 'user-2',
      } as any);

      const arg = mockRepo.save.mock.calls[0][0];
      expect(arg.matchedInvoiceNumbers).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return entry when found', async () => {
      const entry = { id: 're-1' };
      mockRepo.findOne.mockResolvedValue(entry);
      expect(await service.findById('re-1')).toEqual(entry);
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });
  });
});
