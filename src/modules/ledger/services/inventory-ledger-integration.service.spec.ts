import { InventoryLedgerIntegrationService } from './inventory-ledger-integration.service';
import { InventoryJournalService } from './inventory-journal.service';

describe('InventoryLedgerIntegrationService', () => {
  let service: InventoryLedgerIntegrationService;
  let mockJournalService: any;

  beforeEach(() => {
    mockJournalService = {
      generateJournalFromMovement: jest.fn(),
      findRulesByCompany: jest.fn(),
    };
    service = new InventoryLedgerIntegrationService(mockJournalService);
  });

  // ─── processIncomingMovement ─────────────────────────────────
  describe('processIncomingMovement', () => {
    it('should process movement and return result', async () => {
      mockJournalService.generateJournalFromMovement.mockResolvedValue({
        journalEntry: { entry_number: 'JE-001' },
        link: { isReconciled: true },
      });

      const result = await service.processIncomingMovement(
        { id: 'mov-1' },
        { companyProfileId: 'cp-1', movementType: 'RECEIVE', fiscalPeriodId: 'fp-1', itemId: 'i-1', stockMovementId: 'sm-1' },
      );

      expect(result.movementId).toBe('mov-1');
      expect(result.journalEntry).toBe('JE-001');
      expect(result.reconciled).toBe(true);
    });

    it('should pass journalDto to journalService', async () => {
      const journalDto = { companyProfileId: 'cp-1', movementType: 'SALE', fiscalPeriodId: 'fp-1', itemId: 'i-1', stockMovementId: 'sm-1' };
      mockJournalService.generateJournalFromMovement.mockResolvedValue({
        journalEntry: { entry_number: 'JE-002' },
        link: { isReconciled: true },
      });

      await service.processIncomingMovement({ id: 'mov-2' }, journalDto);

      expect(mockJournalService.generateJournalFromMovement).toHaveBeenCalledWith(journalDto);
    });
  });

  // ─── generateReversal ───────────────────────────────────────
  describe('generateReversal', () => {
    it('should return success true (stub)', async () => {
      const result = await service.generateReversal('mov-1');
      expect(result.success).toBe(true);
    });
  });

  // ─── batchProcessMovements ──────────────────────────────────
  describe('batchProcessMovements', () => {
    it('should process multiple movements successfully', async () => {
      mockJournalService.generateJournalFromMovement.mockResolvedValue({
        journalEntry: { entry_number: 'JE-001' },
        link: { isReconciled: true },
      });

      const movements = [
        { id: 'mov-1', journalDto: { companyProfileId: 'cp-1', movementType: 'RECEIVE', fiscalPeriodId: 'fp-1', itemId: 'i-1', stockMovementId: 'sm-1' } },
        { id: 'mov-2', journalDto: { companyProfileId: 'cp-1', movementType: 'SALE', fiscalPeriodId: 'fp-1', itemId: 'i-2', stockMovementId: 'sm-2' } },
      ];

      const results = await service.batchProcessMovements(movements);

      expect(results).toHaveLength(2);
      expect(results[0].movementId).toBe('mov-1');
      expect(results[1].movementId).toBe('mov-2');
    });

    it('should handle errors gracefully for individual movements', async () => {
      mockJournalService.generateJournalFromMovement
        .mockResolvedValueOnce({ journalEntry: { entry_number: 'JE-001' }, link: { isReconciled: true } })
        .mockRejectedValueOnce(new Error('Posting rule not found'));

      const movements = [
        { id: 'mov-1', journalDto: { companyProfileId: 'cp-1', movementType: 'RECEIVE', fiscalPeriodId: 'fp-1', itemId: 'i-1', stockMovementId: 'sm-1' } },
        { id: 'mov-2', journalDto: { companyProfileId: 'cp-1', movementType: 'INVALID', fiscalPeriodId: 'fp-1', itemId: 'i-2', stockMovementId: 'sm-2' } },
      ];

      const results = await service.batchProcessMovements(movements);

      expect(results).toHaveLength(2);
      expect(results[0].movementId).toBe('mov-1');
      expect(results[1].movementId).toBe('mov-2');
      expect(results[1].error).toBe('Posting rule not found');
    });

    it('should return empty array for empty input', async () => {
      const results = await service.batchProcessMovements([]);
      expect(results).toEqual([]);
    });
  });

  // ─── validatePostingRules ───────────────────────────────────
  describe('validatePostingRules', () => {
    it('should return valid=true when all required types have rules', async () => {
      const rules = [
        { movementType: 'RECEIVE' },
        { movementType: 'TRANSFER' },
        { movementType: 'SALE' },
        { movementType: 'RETURN' },
        { movementType: 'ADJUSTMENT' },
      ];
      mockJournalService.findRulesByCompany.mockResolvedValue(rules);

      const result = await service.validatePostingRules('cp-1');

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should return issues for missing types', async () => {
      const rules = [
        { movementType: 'RECEIVE' },
        { movementType: 'SALE' },
      ];
      mockJournalService.findRulesByCompany.mockResolvedValue(rules);

      const result = await service.validatePostingRules('cp-1');

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(3);
      expect(result.issues).toContain('Missing posting rule for TRANSFER');
      expect(result.issues).toContain('Missing posting rule for RETURN');
      expect(result.issues).toContain('Missing posting rule for ADJUSTMENT');
    });

    it('should return all issues when no rules exist', async () => {
      mockJournalService.findRulesByCompany.mockResolvedValue([]);

      const result = await service.validatePostingRules('cp-empty');

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(5);
    });
  });
});
