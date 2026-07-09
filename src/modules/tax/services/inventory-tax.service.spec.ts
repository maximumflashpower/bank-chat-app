import { InventoryTaxService } from './inventory-tax.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('../entities/inventory-tax-line.entity');
jest.mock('../entities/tax-calculation-result.entity');
jest.mock('../entities/tax-jurisdiction-rule.entity');
jest.mock('../entities/tax-product-mapping.entity');

describe('InventoryTaxService', () => {
  let service: InventoryTaxService;
  let mockLineRepo: any;
  let mockCalcRepo: any;
  let mockJurisdictionRepo: any;
  let mockProductMappingRepo: any;

  beforeEach(() => {
    mockLineRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn(), createQueryBuilder: jest.fn().mockReturnValue({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    }) };
    mockCalcRepo = { create: jest.fn(), save: jest.fn() };
    mockJurisdictionRepo = { findOne: jest.fn() };
    mockProductMappingRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    service = new InventoryTaxService(mockLineRepo, mockCalcRepo, mockJurisdictionRepo, mockProductMappingRepo);
  });

  // ─── calculateSalesTax ──────────────────────────────────────
  describe('calculateSalesTax', () => {
    const baseDto = {
      currency: 'USD',
      jurisdictionCode: 'USCA',
      customerId: 'cust-1',
      referenceDoc: 'INV-001',
      calculationMethod: 'exclusive',
      lineItems: [
        { sku: 'SKU-001', quantity: 2, unitPrice: 100, inventoryItemId: 'i-1', itemName: 'Widget' },
      ],
    };

    it('should calculate tax with jurisdiction rate (exclusive)', async () => {
      mockJurisdictionRepo.findOne.mockResolvedValue({
        rateStandard: 0.08, rateReduced: 0.04, rateSuperReduced: 0.02,
        expirationDate: null, active: true,
      });
      mockProductMappingRepo.findOne.mockResolvedValue(null);
      mockLineRepo.create.mockReturnValue({});
      mockLineRepo.save.mockResolvedValue({ id: 'l-1', taxableAmount: 200, taxAmount: 16, totalAmount: 216 });
      mockCalcRepo.create.mockReturnValue({});
      mockCalcRepo.save.mockResolvedValue({ id: 'calc-1' });

      const result = await service.calculateSalesTax(baseDto as any);

      expect(result.totalTaxableAmount).toBe(200);
      expect(result.totalTaxAmount).toBe(16);
      expect(result.totalAmount).toBe(216);
      expect(result.lines).toHaveLength(1);
    });

    it('should use inclusive method when specified', async () => {
      mockJurisdictionRepo.findOne.mockResolvedValue({
        rateStandard: 0.16, rateReduced: 0.08, rateSuperReduced: 0.04,
        expirationDate: null, active: true,
      });
      mockProductMappingRepo.findOne.mockResolvedValue(null);
      mockLineRepo.create.mockReturnValue({});
      mockLineRepo.save.mockResolvedValue({ id: 'l-1', taxableAmount: 100, taxAmount: 13.79, totalAmount: 100 });
      mockCalcRepo.create.mockReturnValue({});
      mockCalcRepo.save.mockResolvedValue({ id: 'calc-2' });

      const result = await service.calculateSalesTax({
        ...baseDto,
        calculationMethod: 'inclusive',
        lineItems: [{ sku: 'SKU-002', quantity: 1, unitPrice: 100, inventoryItemId: 'i-2', itemName: 'Gadget' }],
      } as any);

      // Inclusive: totalAmount = taxableAmount (tax extracted from gross)
      expect(result.lines).toHaveLength(1);
    });

    it('should mark exempt when product mapping has EXEMPT taxability', async () => {
      mockJurisdictionRepo.findOne.mockResolvedValue({
        rateStandard: 0.08, rateReduced: 0.04, rateSuperReduced: 0.02,
        expirationDate: null, active: true,
      });
      mockProductMappingRepo.findOne.mockResolvedValue({
        defaultTaxability: 'EXEMPT',
        notes: 'Tax-exempt medical device',
      });
      mockLineRepo.create.mockReturnValue({});
      mockLineRepo.save.mockResolvedValue({ id: 'l-1', taxableAmount: 200, taxAmount: 0, totalAmount: 200, isExempt: true });
      mockCalcRepo.create.mockReturnValue({});
      mockCalcRepo.save.mockResolvedValue({ id: 'calc-3' });

      const result = await service.calculateSalesTax(baseDto as any);

      expect(result.totalTaxAmount).toBe(0);
      const lineCreateArg = mockLineRepo.create.mock.calls[0][0];
      expect(lineCreateArg.isExempt).toBe(true);
      expect(lineCreateArg.taxability).toBe('EXEMPT');
    });

    it('should apply reverse charge when product mapping allows it', async () => {
      mockJurisdictionRepo.findOne.mockResolvedValue({
        rateStandard: 0.08, rateReduced: 0.04, rateSuperReduced: 0.02,
        expirationDate: null, active: true,
      });
      mockProductMappingRepo.findOne.mockResolvedValue({
        reverseChargeApplicable: true,
      });
      mockLineRepo.create.mockReturnValue({});
      mockLineRepo.save.mockResolvedValue({ id: 'l-1', taxableAmount: 200, taxAmount: 0, totalAmount: 200, reverseCharge: true });
      mockCalcRepo.create.mockReturnValue({});
      mockCalcRepo.save.mockResolvedValue({ id: 'calc-4' });

      const result = await service.calculateSalesTax(baseDto as any);

      const lineCreateArg = mockLineRepo.create.mock.calls[0][0];
      expect(lineCreateArg.reverseCharge).toBe(true);
      expect(lineCreateArg.taxability).toBe('REVERSE_CHARGE');
    });

    it('should use reduced rate when taxCategoryOverride is REDUCED', async () => {
      mockJurisdictionRepo.findOne.mockResolvedValue({
        rateStandard: 0.08, rateReduced: 0.04, rateSuperReduced: 0.02,
        expirationDate: null, active: true,
      });
      mockProductMappingRepo.findOne.mockResolvedValue(null);
      mockLineRepo.create.mockReturnValue({});
      mockLineRepo.save.mockResolvedValue({ id: 'l-1', taxableAmount: 200, taxAmount: 8, totalAmount: 208 });
      mockCalcRepo.create.mockReturnValue({});
      mockCalcRepo.save.mockResolvedValue({ id: 'calc-5' });

      const result = await service.calculateSalesTax({
        ...baseDto,
        lineItems: [{ sku: 'SKU-003', quantity: 2, unitPrice: 100, inventoryItemId: 'i-3', itemName: 'Food', taxCategoryOverride: 'REDUCED' }],
      } as any);

      expect(result.totalTaxAmount).toBe(8);
    });

    it('should handle null jurisdiction (no code)', async () => {
      mockProductMappingRepo.findOne.mockResolvedValue(null);
      mockLineRepo.create.mockReturnValue({});
      mockLineRepo.save.mockResolvedValue({ id: 'l-1', taxableAmount: 200, taxAmount: 0, totalAmount: 200 });
      mockCalcRepo.create.mockReturnValue({});
      mockCalcRepo.save.mockResolvedValue({ id: 'calc-6' });

      const result = await service.calculateSalesTax({
        ...baseDto,
        jurisdictionCode: undefined,
      } as any);

      expect(result.totalTaxAmount).toBe(0);
    });

    it('should handle multiple line items', async () => {
      mockJurisdictionRepo.findOne.mockResolvedValue({
        rateStandard: 0.10, rateReduced: 0.05, rateSuperReduced: 0.02,
        expirationDate: null, active: true,
      });
      mockProductMappingRepo.findOne.mockResolvedValue(null);
      mockLineRepo.create.mockReturnValue({});
      mockLineRepo.save
        .mockResolvedValueOnce({ id: 'l-1', taxableAmount: 200, taxAmount: 20, totalAmount: 220 })
        .mockResolvedValueOnce({ id: 'l-2', taxableAmount: 500, taxAmount: 50, totalAmount: 550 });
      mockCalcRepo.create.mockReturnValue({});
      mockCalcRepo.save.mockResolvedValue({ id: 'calc-7' });

      const result = await service.calculateSalesTax({
        ...baseDto,
        lineItems: [
          { sku: 'SKU-A', quantity: 2, unitPrice: 100, inventoryItemId: 'i-1', itemName: 'A' },
          { sku: 'SKU-B', quantity: 5, unitPrice: 100, inventoryItemId: 'i-2', itemName: 'B' },
        ],
      } as any);

      expect(result.lines).toHaveLength(2);
      expect(result.totalTaxableAmount).toBe(700);
      expect(result.totalTaxAmount).toBe(70);
    });
  });

  // ─── syncProductMappings ───────────────────────────────────
  describe('syncProductMappings', () => {
    it('should create new mappings for unknown SKUs', async () => {
      mockProductMappingRepo.findOne.mockResolvedValue(null);
      mockProductMappingRepo.create.mockReturnValue({});
      mockProductMappingRepo.save.mockResolvedValue({});

      const result = await service.syncProductMappings(['NEW-1', 'NEW-2'], 'US');

      expect(result.synced).toBe(2);
      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
    });

    it('should count existing mappings as synced (no country match)', async () => {
      mockProductMappingRepo.findOne.mockResolvedValue({ id: 'm-1', countryCodes: ['CA'] });

      const result = await service.syncProductMappings(['EXISTING-1'], 'US');

      expect(result.synced).toBe(1);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
    });

    it('should count as updated when country already in mapping', async () => {
      mockProductMappingRepo.findOne.mockResolvedValue({ id: 'm-1', countryCodes: ['US'] });

      const result = await service.syncProductMappings(['EXISTING-1'], 'US');

      expect(result.synced).toBe(1);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
    });

    it('should handle empty SKU list', async () => {
      const result = await service.syncProductMappings([], 'US');

      expect(result.synced).toBe(0);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
    });
  });

  // ─── findTaxLinesByMovement ────────────────────────────────
  describe('findTaxLinesByMovement', () => {
    it('should return lines for a stock movement', async () => {
      const lines = [{ id: 'l-1' }];
      mockLineRepo.find.mockResolvedValue(lines);

      const result = await service.findTaxLinesByMovement('sm-1');

      expect(result).toEqual(lines);
      expect(mockLineRepo.find).toHaveBeenCalledWith({ where: { stockMovementId: 'sm-1' } });
    });

    it('should return empty array when no lines', async () => {
      mockLineRepo.find.mockResolvedValue([]);
      const result = await service.findTaxLinesByMovement('sm-none');
      expect(result).toEqual([]);
    });
  });

  // ─── findTaxLinesByCalculation ─────────────────────────────
  describe('findTaxLinesByCalculation', () => {
    it('should return lines for a calculation result', async () => {
      const lines = [{ id: 'l-1' }];
      mockLineRepo.find.mockResolvedValue(lines);

      const result = await service.findTaxLinesByCalculation('calc-1');

      expect(result).toEqual(lines);
      expect(mockLineRepo.find).toHaveBeenCalledWith({ where: { taxCalculationResultId: 'calc-1' } });
    });

    it('should return empty array when no lines', async () => {
      mockLineRepo.find.mockResolvedValue([]);
      const result = await service.findTaxLinesByCalculation('calc-none');
      expect(result).toEqual([]);
    });
  });

  // ─── getTaxSummary ─────────────────────────────────────────
  describe('getTaxSummary', () => {
    it('should aggregate tax summary from lines', async () => {
      const lines = [
        { taxableAmount: 100, taxAmount: 8, totalAmount: 108, taxCategory: 'STANDARD', isExempt: false, reverseCharge: false },
        { taxableAmount: 200, taxAmount: 16, totalAmount: 216, taxCategory: 'STANDARD', isExempt: false, reverseCharge: false },
      ];
      mockLineRepo.createQueryBuilder().getMany.mockResolvedValue(lines);

      const result = await service.getTaxSummary('cp-1');

      expect(result.totalTaxableAmount).toBe(300);
      expect(result.totalTaxAmount).toBe(24);
      expect(result.totalAmount).toBe(324);
      expect(result.lineCount).toBe(2);
      expect(result.byCategory).toHaveLength(1);
    });

    it('should count exempt and reverseCharge lines separately', async () => {
      const lines = [
        { taxableAmount: 100, taxAmount: 0, totalAmount: 100, taxCategory: 'STANDARD', isExempt: true, reverseCharge: false },
        { taxableAmount: 200, taxAmount: 0, totalAmount: 200, taxCategory: 'STANDARD', isExempt: false, reverseCharge: true },
      ];
      mockLineRepo.createQueryBuilder().getMany.mockResolvedValue(lines);

      const result = await service.getTaxSummary('cp-1');

      expect(result.exemptCount).toBe(1);
      expect(result.reverseChargeCount).toBe(1);
    });

    it('should handle empty results', async () => {
      mockLineRepo.createQueryBuilder().getMany.mockResolvedValue([]);

      const result = await service.getTaxSummary('cp-1');

      expect(result.totalTaxableAmount).toBe(0);
      expect(result.totalTaxAmount).toBe(0);
      expect(result.lineCount).toBe(0);
      expect(result.byCategory).toEqual([]);
    });

    it('should group by taxCategory', async () => {
      const lines = [
        { taxableAmount: 100, taxAmount: 8, totalAmount: 108, taxCategory: 'STANDARD', isExempt: false, reverseCharge: false },
        { taxableAmount: 200, taxAmount: 8, totalAmount: 208, taxCategory: 'REDUCED', isExempt: false, reverseCharge: false },
      ];
      mockLineRepo.createQueryBuilder().getMany.mockResolvedValue(lines);

      const result = await service.getTaxSummary('cp-1');

      expect(result.byCategory).toHaveLength(2);
      const standard = result.byCategory.find(c => c.category === 'STANDARD');
      expect(standard.taxable).toBe(100);
      const reduced = result.byCategory.find(c => c.category === 'REDUCED');
      expect(reduced.taxable).toBe(200);
    });
  });
});
