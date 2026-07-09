import { TaxAuditService } from './tax-audit.service';

jest.mock('../entities/tax-calculation-result.entity');
jest.mock('../entities/tax-declaration-period.entity');

describe('TaxAuditService', () => {
  let service: TaxAuditService;
  let mockCalcRepo: any;
  let mockDeclRepo: any;

  beforeEach(() => {
    mockCalcRepo = { findOne: jest.fn(), find: jest.fn() };
    mockDeclRepo = { findOne: jest.fn(), find: jest.fn() };
    service = new TaxAuditService(mockCalcRepo, mockDeclRepo);
  });

  // ─── getCalculationTrail ────────────────────────────────────
  describe('getCalculationTrail', () => {
    it('should return calculation when found', async () => {
      const calc = { id: 'c-1', taxAmount: 160 };
      mockCalcRepo.findOne.mockResolvedValue(calc);

      const result = await service.getCalculationTrail('c-1');

      expect(result).toEqual(calc);
      expect(mockCalcRepo.findOne).toHaveBeenCalledWith({ where: { id: 'c-1' } });
    });

    it('should return null when not found', async () => {
      mockCalcRepo.findOne.mockResolvedValue(null);
      const result = await service.getCalculationTrail('missing');
      expect(result).toBeNull();
    });
  });

  // ─── getDeclarationBreakdown ───────────────────────────────
  describe('getDeclarationBreakdown', () => {
    it('should return declaration when found', async () => {
      const decl = { id: 'd-1', status: 'computed' };
      mockDeclRepo.findOne.mockResolvedValue(decl);

      const result = await service.getDeclarationBreakdown('d-1');

      expect(result).toEqual(decl);
      expect(mockDeclRepo.findOne).toHaveBeenCalledWith({ where: { id: 'd-1' } });
    });

    it('should return null when not found', async () => {
      mockDeclRepo.findOne.mockResolvedValue(null);
      const result = await service.getDeclarationBreakdown('missing');
      expect(result).toBeNull();
    });
  });

  // ─── reconcileWithLedger ───────────────────────────────────
  describe('reconcileWithLedger', () => {
    it('should return reconciled=false when declaration not found', async () => {
      mockDeclRepo.findOne.mockResolvedValue(null);

      const result = await service.reconcileWithLedger('missing', {});

      expect(result.reconciled).toBe(false);
      expect(result.discrepancies).toContain('Declaration not found');
    });

    it('should return reconciled=true when balances match', async () => {
      mockDeclRepo.findOne.mockResolvedValue({
        id: 'd-1', outputTax: 1000, inputTax: 500,
      });

      const result = await service.reconcileWithLedger('d-1', {
        output_tax: 1000,
        input_tax: 500,
      });

      expect(result.reconciled).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
    });

    it('should detect output tax mismatch', async () => {
      mockDeclRepo.findOne.mockResolvedValue({
        id: 'd-1', outputTax: 1000, inputTax: 500,
      });

      const result = await service.reconcileWithLedger('d-1', {
        output_tax: 900,
        input_tax: 500,
      });

      expect(result.reconciled).toBe(false);
      expect(result.discrepancies[0]).toContain('Output tax mismatch');
    });

    it('should detect input tax mismatch', async () => {
      mockDeclRepo.findOne.mockResolvedValue({
        id: 'd-1', outputTax: 1000, inputTax: 500,
      });

      const result = await service.reconcileWithLedger('d-1', {
        output_tax: 1000,
        input_tax: 400,
      });

      expect(result.reconciled).toBe(false);
      expect(result.discrepancies[0]).toContain('Input tax mismatch');
    });

    it('should pass when ledger balances are missing (defaults to 0)', async () => {
      mockDeclRepo.findOne.mockResolvedValue({
        id: 'd-1', outputTax: 0, inputTax: 0,
      });

      const result = await service.reconcileWithLedger('d-1', {});

      expect(result.reconciled).toBe(true);
    });
  });

  // ─── getAuditSummary ───────────────────────────────────────
  describe('getAuditSummary', () => {
    it('should aggregate calculations and declarations', async () => {
      mockCalcRepo.find.mockResolvedValue([
        { taxAmount: 100 },
        { taxAmount: 200 },
      ]);
      mockDeclRepo.find.mockResolvedValue([
        { inputTax: 50 },
        { inputTax: 150 },
      ]);

      const result = await service.getAuditSummary('MX', 2026);

      expect(result.totalCalculations).toBe(2);
      expect(result.totalDeclarations).toBe(2);
      expect(result.totalTaxCollected).toBe(300);
      expect(result.totalTaxPaid).toBe(200);
    });

    it('should return zeros when no data', async () => {
      mockCalcRepo.find.mockResolvedValue([]);
      mockDeclRepo.find.mockResolvedValue([]);

      const result = await service.getAuditSummary('XX', 2026);

      expect(result.totalCalculations).toBe(0);
      expect(result.totalDeclarations).toBe(0);
      expect(result.totalTaxCollected).toBe(0);
      expect(result.totalTaxPaid).toBe(0);
    });

    it('should handle null taxAmount as 0', async () => {
      mockCalcRepo.find.mockResolvedValue([{ taxAmount: null }]);
      mockDeclRepo.find.mockResolvedValue([{ inputTax: null }]);

      const result = await service.getAuditSummary('MX', 2026);

      expect(result.totalTaxCollected).toBe(0);
      expect(result.totalTaxPaid).toBe(0);
    });

    it('should filter declarations by countryCode', async () => {
      mockCalcRepo.find.mockResolvedValue([]);
      mockDeclRepo.find.mockResolvedValue([]);

      await service.getAuditSummary('BR', 2026);

      expect(mockDeclRepo.find).toHaveBeenCalledWith({ where: { countryCode: 'BR' } });
    });
  });
});
