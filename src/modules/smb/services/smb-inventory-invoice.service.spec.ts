import { SmbInventoryInvoiceService } from './smb-inventory-invoice.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('../entities/smb-invoice-document.entity');
jest.mock('../entities/smb-invoice-line-item.entity');
jest.mock('../entities/smb-contact-party.entity');

describe('SmbInventoryInvoiceService', () => {
  let service: SmbInventoryInvoiceService;
  let mockInvoiceRepo: any;
  let mockLineItemRepo: any;
  let mockContactRepo: any;
  let mockStockMovementService: any;
  let mockInventoryTaxService: any;

  beforeEach(() => {
    mockInvoiceRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), update: jest.fn() };
    mockLineItemRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn() };
    mockContactRepo = { findOne: jest.fn(), update: jest.fn() };
    mockStockMovementService = { sale: jest.fn() };
    mockInventoryTaxService = { calculateSalesTax: jest.fn() };
    service = new SmbInventoryInvoiceService(
      mockInvoiceRepo, mockLineItemRepo, mockContactRepo,
      mockStockMovementService, mockInventoryTaxService,
    );
  });

  describe('createInvoiceWithItems', () => {
    it('should throw NotFoundException when customer not found', async () => {
      mockContactRepo.findOne.mockResolvedValue(null);
      await expect(service.createInvoiceWithItems({ customerId: 'missing', lineItems: [] } as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when no line items', async () => {
      mockContactRepo.findOne.mockResolvedValue({ id: 'cust-1' });
      await expect(service.createInvoiceWithItems({ customerId: 'cust-1', lineItems: [] } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should create invoice, line items, and stock movements', async () => {
      mockContactRepo.findOne.mockResolvedValue({ id: 'cust-1' });
      mockStockMovementService.sale.mockResolvedValue({ id: 'mv-1' });
      mockInvoiceRepo.create.mockReturnValue({ id: 'inv-1' });
      mockInvoiceRepo.save.mockResolvedValue({ id: 'inv-1' });
      mockLineItemRepo.create.mockReturnValue({ id: 'li-1' });
      mockLineItemRepo.save.mockResolvedValue({ id: 'li-1' });
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1' });

      const result = await service.createInvoiceWithItems({
        customerId: 'cust-1',
        issueDate: '2026-01-01',
        dueDate: '2026-01-31',
        warehouseId: 'wh-1',
        lineItems: [{ inventoryItemId: 'i1', quantity: 2, unitPrice: 10, itemName: 'Widget', sku: 'W1' }],
      } as any);

      expect(result.invoice).toEqual({ id: 'inv-1' });
      expect(result.lineItems).toHaveLength(1);
      expect(result.stockMovementIds).toEqual(['mv-1']);
    });

    it('should calculate subtotal, discount, and taxableBase', async () => {
      mockContactRepo.findOne.mockResolvedValue({ id: 'cust-1' });
      mockStockMovementService.sale.mockResolvedValue({ id: 'mv-1' });
      mockInvoiceRepo.create.mockReturnValue({});
      mockInvoiceRepo.save.mockResolvedValue({ id: 'inv-1' });
      mockLineItemRepo.create.mockReturnValue({});
      mockLineItemRepo.save.mockResolvedValue({ id: 'li-1' });
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1' });

      await service.createInvoiceWithItems({
        customerId: 'cust-1',
        issueDate: '2026-01-01',
        dueDate: '2026-01-31',
        warehouseId: 'wh-1',
        discountPercentageApplied: 10,
        lineItems: [{ inventoryItemId: 'i1', quantity: 2, unitPrice: 100, itemName: 'Widget', sku: 'W1' }],
      } as any);

      const arg = mockInvoiceRepo.create.mock.calls[0][0];
      expect(arg.subtotalNetAmount).toBe(200);
      expect(arg.discountAbsoluteAmount).toBe(20);
      expect(arg.taxableBaseAmount).toBe(180);
    });

    it('should not calculate discount when percentage is 0 or undefined', async () => {
      mockContactRepo.findOne.mockResolvedValue({ id: 'cust-1' });
      mockStockMovementService.sale.mockResolvedValue({ id: 'mv-1' });
      mockInvoiceRepo.create.mockReturnValue({});
      mockInvoiceRepo.save.mockResolvedValue({ id: 'inv-1' });
      mockLineItemRepo.create.mockReturnValue({});
      mockLineItemRepo.save.mockResolvedValue({ id: 'li-1' });
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1' });

      await service.createInvoiceWithItems({
        customerId: 'cust-1',
        issueDate: '2026-01-01',
        dueDate: '2026-01-31',
        warehouseId: 'wh-1',
        lineItems: [{ inventoryItemId: 'i1', quantity: 1, unitPrice: 100, itemName: 'Widget', sku: 'W1' }],
      } as any);

      const arg = mockInvoiceRepo.create.mock.calls[0][0];
      expect(arg.discountAbsoluteAmount).toBeUndefined();
      expect(arg.taxableBaseAmount).toBe(100);
    });

    it('should calculate taxes when jurisdictionCode is provided', async () => {
      mockContactRepo.findOne.mockResolvedValue({ id: 'cust-1' });
      mockStockMovementService.sale.mockResolvedValue({ id: 'mv-1' });
      mockInvoiceRepo.create.mockReturnValue({});
      mockInvoiceRepo.save.mockResolvedValue({ id: 'inv-1' });
      mockLineItemRepo.create.mockReturnValue({});
      mockLineItemRepo.save.mockResolvedValue({ id: 'li-1' });
      mockInventoryTaxService.calculateSalesTax.mockResolvedValue({
        taxCalculationResult: { id: 'tax-1' },
        totalTaxAmount: 15,
        lines: [{ appliedRate: 0.1, taxAmount: 15 }],
      });
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1' });

      const result = await service.createInvoiceWithItems({
        customerId: 'cust-1',
        issueDate: '2026-01-01',
        dueDate: '2026-01-31',
        warehouseId: 'wh-1',
        jurisdictionCode: 'US-CA',
        lineItems: [{ inventoryItemId: 'i1', quantity: 1, unitPrice: 150, itemName: 'Widget', sku: 'W1' }],
      } as any);

      expect(result.taxCalculationResultId).toBe('tax-1');
      expect(mockInventoryTaxService.calculateSalesTax).toHaveBeenCalled();
      expect(mockInvoiceRepo.update).toHaveBeenCalledWith('inv-1', expect.objectContaining({
        taxAmountCalculated: 15,
      }));
    });

    it('should update contact lastInvoiceDate', async () => {
      mockContactRepo.findOne.mockResolvedValue({ id: 'cust-1' });
      mockStockMovementService.sale.mockResolvedValue({ id: 'mv-1' });
      mockInvoiceRepo.create.mockReturnValue({});
      mockInvoiceRepo.save.mockResolvedValue({ id: 'inv-1' });
      mockLineItemRepo.create.mockReturnValue({});
      mockLineItemRepo.save.mockResolvedValue({ id: 'li-1' });
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1' });

      await service.createInvoiceWithItems({
        customerId: 'cust-1',
        issueDate: '2026-06-15',
        dueDate: '2026-06-30',
        warehouseId: 'wh-1',
        lineItems: [{ inventoryItemId: 'i1', quantity: 1, unitPrice: 50, itemName: 'X', sku: 'S' }],
      } as any);

      expect(mockContactRepo.update).toHaveBeenCalledWith('cust-1', expect.objectContaining({
        lastInvoiceDate: new Date('2026-06-15'),
      }));
    });
  });

  describe('findInvoiceWithItems', () => {
    it('should return invoice and line items when found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1' });
      mockLineItemRepo.find.mockResolvedValue([{ id: 'li-1' }]);

      const result = await service.findInvoiceWithItems('inv-1');

      expect(result.invoice).toEqual({ id: 'inv-1' });
      expect(result.lineItems).toHaveLength(1);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.findInvoiceWithItems('missing')).rejects.toThrow(NotFoundException);
    });

    it('should order line items by sortOrder ASC', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 'inv-1' });
      mockLineItemRepo.find.mockResolvedValue([]);
      await service.findInvoiceWithItems('inv-1');
      expect(mockLineItemRepo.find).toHaveBeenCalledWith({ where: { invoiceId: 'inv-1' }, order: { sortOrder: 'ASC' } });
    });
  });

  describe('findLineItemsByInvoice', () => {
    it('should return line items ordered by sortOrder', async () => {
      mockLineItemRepo.find.mockResolvedValue([{ id: 'li-1' }]);
      const result = await service.findLineItemsByInvoice('inv-1');
      expect(result).toHaveLength(1);
      expect(mockLineItemRepo.find).toHaveBeenCalledWith({ where: { invoiceId: 'inv-1' }, order: { sortOrder: 'ASC' } });
    });
  });
});
