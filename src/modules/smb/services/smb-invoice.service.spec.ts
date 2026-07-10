import { SmbInvoiceService } from './smb-invoice.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('../entities/smb-invoice-document.entity');
jest.mock('../entities/smb-contact-party.entity');

describe('SmbInvoiceService', () => {
  let service: SmbInvoiceService;
  let mockInvoiceRepo: any;
  let mockContactRepo: any;

  beforeEach(() => {
    mockInvoiceRepo = {
      create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn(), update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      }),
    };
    mockContactRepo = { findOne: jest.fn(), update: jest.fn() };
    service = new SmbInvoiceService(mockInvoiceRepo, mockContactRepo);
  });

  describe('create', () => {
    it('should create invoice with generated number and draft status', async () => {
      mockContactRepo.findOne.mockResolvedValue({ id: 'cust-1' });
      mockInvoiceRepo.create.mockReturnValue({ id: 'inv-1' });
      mockInvoiceRepo.save.mockResolvedValue({ id: 'inv-1' });

      const result = await service.create({ customerId: 'cust-1', issueDate: '2026-01-01', dueDate: '2026-01-31', grandTotalAmountDue: 100 } as any);

      expect(result).toEqual({ id: 'inv-1' });
      const arg = mockInvoiceRepo.create.mock.calls[0][0];
      expect(arg.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
      expect(arg.status).toBe('draft');
      expect(arg.paidAmountTotalReceived).toBe(0);
      expect(arg.remainingBalanceOwed).toBe(100);
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockContactRepo.findOne.mockResolvedValue(null);
      await expect(service.create({ customerId: 'missing' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should update customer lastInvoiceDate', async () => {
      mockContactRepo.findOne.mockResolvedValue({ id: 'cust-1' });
      mockInvoiceRepo.create.mockReturnValue({});
      mockInvoiceRepo.save.mockResolvedValue({});
      await service.create({ customerId: 'cust-1', issueDate: '2026-06-15', dueDate: '2026-06-30', grandTotalAmountDue: 100 } as any);
      expect(mockContactRepo.update).toHaveBeenCalledWith('cust-1', { lastInvoiceDate: new Date('2026-06-15') });
    });
  });

  describe('findById', () => {
    it('should return invoice when found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1' });
      expect(await service.findById('inv-1')).toEqual({ id: 'inv-1' });
    });

    it('should return null when not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should filter by status when provided', async () => {
      mockInvoiceRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      await service.findAll({ status: 'draft' });
      expect(mockInvoiceRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('inv.status = :status', { status: 'draft' });
    });

    it('should filter by customerId when provided', async () => {
      mockInvoiceRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      await service.findAll({ customerId: 'cust-1' });
      expect(mockInvoiceRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('inv.customerId = :customerId', { customerId: 'cust-1' });
    });

    it('should order by createdAt DESC', async () => {
      mockInvoiceRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      await service.findAll();
      expect(mockInvoiceRepo.createQueryBuilder().orderBy).toHaveBeenCalledWith('inv.createdAt', 'DESC');
    });
  });

  describe('send', () => {
    it('should set status to issued and sentAt', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1' });
      await service.send('inv-1');
      const arg = mockInvoiceRepo.update.mock.calls[0][1];
      expect(arg.status).toBe('issued');
      expect(arg.sentAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.send('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordView', () => {
    it('should increment viewTrackingCount', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1', viewTrackingCount: 5 });
      await service.recordView('inv-1');
      expect(mockInvoiceRepo.update).toHaveBeenCalledWith('inv-1', { viewTrackingCount: 6 });
    });

    it('should handle null viewTrackingCount', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1', viewTrackingCount: null });
      await service.recordView('inv-1');
      expect(mockInvoiceRepo.update).toHaveBeenCalledWith('inv-1', { viewTrackingCount: 1 });
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.recordView('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsPaid', () => {
    it('should set full_paid when remaining <= 0', async () => {
      mockInvoiceRepo.findOne.mockResolvedValueOnce({ id: 'inv-1', paidAmountTotalReceived: 0, grandTotalAmountDue: 100 })
        .mockResolvedValueOnce({ id: 'inv-1', status: 'full_paid' });
      const result = await service.markAsPaid('inv-1', 100);
      expect(result.status).toBe('full_paid');
      const arg = mockInvoiceRepo.update.mock.calls[0][1];
      expect(arg.paidAmountTotalReceived).toBe(100);
      expect(arg.remainingBalanceOwed).toBe(0);
      expect(arg.status).toBe('full_paid');
    });

    it('should set partial_paid when remaining > 0', async () => {
      mockInvoiceRepo.findOne.mockResolvedValueOnce({ id: 'inv-1', paidAmountTotalReceived: 0, grandTotalAmountDue: 100 })
        .mockResolvedValueOnce({ id: 'inv-1', status: 'partial_paid' });
      await service.markAsPaid('inv-1', 50);
      expect(mockInvoiceRepo.update.mock.calls[0][1].status).toBe('partial_paid');
    });

    it('should accumulate paid amounts', async () => {
      mockInvoiceRepo.findOne.mockResolvedValueOnce({ id: 'inv-1', paidAmountTotalReceived: 30, grandTotalAmountDue: 100 })
        .mockResolvedValueOnce({ id: 'inv-1' });
      await service.markAsPaid('inv-1', 50);
      expect(mockInvoiceRepo.update.mock.calls[0][1].paidAmountTotalReceived).toBe(80);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.markAsPaid('missing', 100)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOverdue', () => {
    it('should find invoices with issued status and dueDate <= today', async () => {
      mockInvoiceRepo.find.mockResolvedValue([{ id: 'inv-1' }]);
      const result = await service.findOverdue();
      expect(result).toHaveLength(1);
    });
  });

  describe('createRecurring', () => {
    it('should create new invoice from parent with new number and draft status', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1', grandTotalAmountDue: 200, customerId: 'cust-1' });
      mockInvoiceRepo.create.mockReturnValue({ id: 'inv-2' });
      mockInvoiceRepo.save.mockResolvedValue({ id: 'inv-2' });

      const result = await service.createRecurring('inv-1', 'monthly');

      expect(result).toEqual({ id: 'inv-2' });
      const arg = mockInvoiceRepo.create.mock.calls[0][0];
      expect(arg.id).toBeUndefined();
      expect(arg.status).toBe('draft');
      expect(arg.paidAmountTotalReceived).toBe(0);
      expect(arg.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('should throw NotFoundException when parent not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.createRecurring('missing', 'monthly')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createEstimate', () => {
    it('should create estimate with EST- prefix', async () => {
      mockInvoiceRepo.create.mockReturnValue({ id: 'est-1' });
      mockInvoiceRepo.save.mockResolvedValue({ id: 'est-1' });

      const result = await service.createEstimate({ customerId: 'cust-1', issueDate: '2026-01-01', dueDate: '2026-01-31', grandTotalAmountDue: 100 } as any);

      expect(result).toEqual({ id: 'est-1' });
      const arg = mockInvoiceRepo.create.mock.calls[0][0];
      expect(arg.invoiceNumber).toMatch(/^EST-/);
      expect(arg.status).toBe('estimate');
    });
  });

  describe('convertEstimateToInvoice', () => {
    it('should update status to draft and generate new invoice number', async () => {
      mockInvoiceRepo.findOne.mockResolvedValueOnce({ id: 'est-1' }).mockResolvedValueOnce({ id: 'est-1', status: 'draft' });

      const result = await service.convertEstimateToInvoice('est-1');

      expect(result.status).toBe('draft');
      expect(mockInvoiceRepo.update).toHaveBeenCalledWith('est-1', expect.objectContaining({
        status: 'draft',
        invoiceNumber: expect.stringMatching(/^INV-\d{4}-\d{4}$/),
      }));
    });

    it('should throw NotFoundException when estimate not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.convertEstimateToInvoice('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCreditNote', () => {
    it('should create credit note with negative amounts and CN- prefix', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1', customerId: 'cust-1', currencyIsoCode: 'USD', createdByUserId: 'user-1' });
      mockInvoiceRepo.create.mockReturnValue({ id: 'cn-1' });
      mockInvoiceRepo.save.mockResolvedValue({ id: 'cn-1' });

      const result = await service.createCreditNote('inv-1', 50, 'refund');

      expect(result).toEqual({ id: 'cn-1' });
      const arg = mockInvoiceRepo.create.mock.calls[0][0];
      expect(arg.invoiceNumber).toMatch(/^CN-/);
      expect(arg.status).toBe('credit_note');
      expect(arg.subtotalNetAmount).toBe(-50);
      expect(arg.grandTotalAmountDue).toBe(-50);
    });

    it('should throw NotFoundException when original invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.createCreditNote('missing', 50, 'refund')).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateStatement', () => {
    it('should return customer statement with totals and invoice list', async () => {
      mockInvoiceRepo.find.mockResolvedValue([
        { invoiceNumber: 'INV-1', status: 'issued', grandTotalAmountDue: 100, remainingBalanceOwed: 50 },
        { invoiceNumber: 'INV-2', status: 'full_paid', grandTotalAmountDue: 200, remainingBalanceOwed: 0 },
      ]);

      const result = await service.generateStatement('cust-1');

      expect(result.customerId).toBe('cust-1');
      expect(result.totalOutstanding).toBe(50);
      expect(result.invoiceCount).toBe(2);
      expect(result.invoices).toHaveLength(2);
    });
  });
});
