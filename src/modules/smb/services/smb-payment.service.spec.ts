import { SmbPaymentService } from './smb-payment.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('../entities/smb-invoice-document.entity');

describe('SmbPaymentService', () => {
  let service: SmbPaymentService;
  let mockInvoiceRepo: any;

  beforeEach(() => {
    mockInvoiceRepo = { findOne: jest.fn(), update: jest.fn() };
    service = new SmbPaymentService(mockInvoiceRepo);
  });

  describe('processOnlinePayment', () => {
    it('should update invoice and return success with transactionId', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1', paidAmountTotalReceived: 0, grandTotalAmountDue: 100 });
      const result = await service.processOnlinePayment('inv-1', 100, 'card');
      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^TXN-\d+$/);
      expect(mockInvoiceRepo.update.mock.calls[0][1].status).toBe('full_paid');
    });

    it('should set partial_paid when amount is less than total', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1', paidAmountTotalReceived: 0, grandTotalAmountDue: 100 });
      await service.processOnlinePayment('inv-1', 50, 'card');
      expect(mockInvoiceRepo.update.mock.calls[0][1].status).toBe('partial_paid');
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.processOnlinePayment('missing', 100, 'card')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsPaid', () => {
    it('should update invoice with full_paid status', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1', paidAmountTotalReceived: 0, grandTotalAmountDue: 100 });
      await service.markAsPaid({ invoiceId: 'inv-1', amountPaid: 100 } as any);
      expect(mockInvoiceRepo.update.mock.calls[0][1].status).toBe('full_paid');
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.markAsPaid({ invoiceId: 'missing', amountPaid: 100 } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReminderCampaign', () => {
    it('should count sent for existing invoices', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1' });
      const result = await service.createReminderCampaign({ invoiceIds: ['inv-1'] } as any);
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should count failed for missing invoices', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      const result = await service.createReminderCampaign({ invoiceIds: ['missing'] } as any);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('should handle mixed results', async () => {
      mockInvoiceRepo.findOne.mockResolvedValueOnce({ id: 'inv-1' }).mockResolvedValueOnce(null);
      const result = await service.createReminderCampaign({ invoiceIds: ['inv-1', 'missing'] } as any);
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('applyLateFee', () => {
    it('should add late fee to grandTotal and remaining', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1', lateFeePenaltyCharged: 0, grandTotalAmountDue: 100, remainingBalanceOwed: 50 });
      await service.applyLateFee('inv-1', 10);
      const arg = mockInvoiceRepo.update.mock.calls[0][1];
      expect(arg.lateFeePenaltyCharged).toBe(10);
      expect(arg.grandTotalAmountDue).toBe(110);
      expect(arg.remainingBalanceOwed).toBe(60);
    });

    it('should accumulate late fees', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1', lateFeePenaltyCharged: 5, grandTotalAmountDue: 100, remainingBalanceOwed: 50 });
      await service.applyLateFee('inv-1', 10);
      expect(mockInvoiceRepo.update.mock.calls[0][1].lateFeePenaltyCharged).toBe(15);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.applyLateFee('missing', 10)).rejects.toThrow(NotFoundException);
    });
  });

  describe('generatePaymentLink', () => {
    it('should return url with token and expiration 30 days ahead', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1' });
      const result = await service.generatePaymentLink('inv-1');
      expect(result.url).toContain('https://pay.example.com/invoice/inv-1?token=');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.generatePaymentLink('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInvoicePayments', () => {
    it('should return payment summary for invoice', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1', grandTotalAmountDue: 100, paidAmountTotalReceived: 60, remainingBalanceOwed: 40, status: 'partial_paid' });
      const result = await service.getInvoicePayments('inv-1');
      expect(result.totalDue).toBe(100);
      expect(result.totalPaid).toBe(60);
      expect(result.remaining).toBe(40);
      expect(result.status).toBe('partial_paid');
    });

    it('should handle null paidAmountTotalReceived', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1', grandTotalAmountDue: 100, paidAmountTotalReceived: null, remainingBalanceOwed: null, status: 'issued' });
      const result = await service.getInvoicePayments('inv-1');
      expect(result.totalPaid).toBe(0);
      expect(result.remaining).toBe(0);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.getInvoicePayments('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
