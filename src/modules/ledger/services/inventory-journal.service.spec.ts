import { InventoryJournalService } from './inventory-journal.service';
import { BadRequestException } from '@nestjs/common';
import { FiscalPeriodStatus } from '../entities/fiscal-period-status.enum';

jest.mock('../entities/inventory-account-mapping.entity');
jest.mock('../entities/inventory-journal-link.entity');
jest.mock('../entities/inventory-posting-rule.entity');
jest.mock('../entities/ledger_journal_entry.entity');
jest.mock('../entities/ledger_journal_line.entity');
jest.mock('../entities/ledger_fiscal_period.entity');

describe('InventoryJournalService', () => {
  let service: InventoryJournalService;
  let mockMappingRepo: any;
  let mockLinkRepo: any;
  let mockRuleRepo: any;
  let mockJeRepo: any;
  let mockLineRepo: any;
  let mockPeriodRepo: any;

  beforeEach(() => {
    mockMappingRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn() };
    mockLinkRepo = {
      create: jest.fn(), save: jest.fn(), find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };
    mockRuleRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn() };
    mockJeRepo = { create: jest.fn(), save: jest.fn() };
    mockLineRepo = { create: jest.fn(), save: jest.fn() };
    mockPeriodRepo = { findOne: jest.fn() };
    service = new InventoryJournalService(
      mockMappingRepo, mockLinkRepo, mockRuleRepo, mockJeRepo, mockLineRepo, mockPeriodRepo,
    );
  });

  // ─── createAccountMapping ───────────────────────────────────
  describe('createAccountMapping', () => {
    it('should create and return account mapping', async () => {
      const created = { id: 'm-1' };
      mockMappingRepo.create.mockReturnValue(created);
      mockMappingRepo.save.mockResolvedValue(created);

      const result = await service.createAccountMapping({
        companyId: 'cp-1', category: 'ELECTRONICS', movementType: 'RECEIVE', accountId: 'acc-1',
      });

      expect(result).toEqual(created);
      expect(mockMappingRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        companyProfileId: 'cp-1',
        movementType: 'RECEIVE',
      }));
    });
  });

  // ─── findByCompanyAndMovement ───────────────────────────────
  describe('findByCompanyAndMovement', () => {
    it('should return mappings with relations', async () => {
      const mappings = [{ id: 'm-1' }];
      mockMappingRepo.find.mockResolvedValue(mappings);

      const result = await service.findByCompanyAndMovement('cp-1', 'RECEIVE');

      expect(result).toEqual(mappings);
      expect(mockMappingRepo.find).toHaveBeenCalledWith({
        where: { companyProfileId: 'cp-1', movementType: 'RECEIVE' },
        relations: { account: true },
      });
    });

    it('should return empty array when no mappings', async () => {
      mockMappingRepo.find.mockResolvedValue([]);
      const result = await service.findByCompanyAndMovement('cp-none', 'SALE');
      expect(result).toEqual([]);
    });
  });

  // ─── createPostingRule ──────────────────────────────────────
  describe('createPostingRule', () => {
    it('should create and return posting rule', async () => {
      const created = { id: 'r-1' };
      mockRuleRepo.create.mockReturnValue(created);
      mockRuleRepo.save.mockResolvedValue(created);

      const result = await service.createPostingRule({
        companyProfileId: 'cp-1', movementType: 'RECEIVE',
        debitAccountType: 'INVENTORY', debitAccountId: 'acc-1',
        creditAccountType: 'AP', creditAccountId: 'acc-2',
      });

      expect(result).toEqual(created);
      expect(mockRuleRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        movementType: 'RECEIVE',
        debitAccountId: 'acc-1',
        creditAccountId: 'acc-2',
      }));
    });
  });

  // ─── findRulesByCompany ─────────────────────────────────────
  describe('findRulesByCompany', () => {
    it('should return active rules for company', async () => {
      const rules = [{ id: 'r-1', isActive: true }];
      mockRuleRepo.find.mockResolvedValue(rules);

      const result = await service.findRulesByCompany('cp-1');

      expect(result).toEqual(rules);
      expect(mockRuleRepo.find).toHaveBeenCalledWith({
        where: { companyProfileId: 'cp-1', isActive: true },
      });
    });

    it('should return empty array when no rules', async () => {
      mockRuleRepo.find.mockResolvedValue([]);
      const result = await service.findRulesByCompany('cp-none');
      expect(result).toEqual([]);
    });
  });

  // ─── generateJournalFromMovement ────────────────────────────
  describe('generateJournalFromMovement', () => {
    const validDto = {
      companyProfileId: 'cp-1',
      movementType: 'RECEIVE',
      fiscalPeriodId: 'fp-1',
      itemId: 'item-1',
      quantity: 10,
      unitCost: 50,
      reference: 'PO-001',
      stockMovementId: 'sm-1',
    };

    it('should throw BadRequestException if no posting rule found', async () => {
      mockRuleRepo.findOne.mockResolvedValue(null);

      await expect(service.generateJournalFromMovement(validDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if fiscal period not found', async () => {
      mockRuleRepo.findOne.mockResolvedValue({ id: 'r-1', movementType: 'RECEIVE' });
      mockPeriodRepo.findOne.mockResolvedValue(null);

      await expect(service.generateJournalFromMovement(validDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if fiscal period is not OPEN', async () => {
      mockRuleRepo.findOne.mockResolvedValue({ id: 'r-1', movementType: 'RECEIVE' });
      mockPeriodRepo.findOne.mockResolvedValue({ id: 'fp-1', status: FiscalPeriodStatus.CLOSED });

      await expect(service.generateJournalFromMovement(validDto)).rejects.toThrow(BadRequestException);
    });

    it('should generate journal entry with debit and credit lines', async () => {
      const rule = { id: 'r-1', debitAccountId: 'acc-1', creditAccountId: 'acc-2' };
      mockRuleRepo.findOne.mockResolvedValue(rule);
      mockPeriodRepo.findOne.mockResolvedValue({ id: 'fp-1', status: FiscalPeriodStatus.OPEN });
      const savedEntry = { id: 'je-1', entry_number: 'INV-001' };
      mockJeRepo.create.mockReturnValue(savedEntry);
      mockJeRepo.save.mockResolvedValue(savedEntry);
      mockLineRepo.create.mockReturnValue({});
      mockLineRepo.save.mockResolvedValue({});
      const savedLink = { id: 'l-1', isReconciled: true };
      mockLinkRepo.create.mockReturnValue(savedLink);
      mockLinkRepo.save.mockResolvedValue(savedLink);

      const result = await service.generateJournalFromMovement(validDto);

      expect(result.journalEntry).toEqual(savedEntry);
      expect(result.link).toEqual(savedLink);
      expect(mockJeRepo.create).toHaveBeenCalled();
      expect(mockLineRepo.save).toHaveBeenCalledTimes(2);
      expect(mockLinkRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should use totalCost when provided instead of unitCost * quantity', async () => {
      const dtoWithTotalCost = { ...validDto, totalCost: 999 };
      mockRuleRepo.findOne.mockResolvedValue({ id: 'r-1', debitAccountId: 'acc-1', creditAccountId: 'acc-2' });
      mockPeriodRepo.findOne.mockResolvedValue({ id: 'fp-1', status: FiscalPeriodStatus.OPEN });
      mockJeRepo.create.mockReturnValue({ id: 'je-1' });
      mockJeRepo.save.mockResolvedValue({ id: 'je-1' });
      mockLineRepo.create.mockReturnValue({});
      mockLineRepo.save.mockResolvedValue({});
      mockLinkRepo.create.mockReturnValue({});
      mockLinkRepo.save.mockResolvedValue({});

      await service.generateJournalFromMovement(dtoWithTotalCost);

      const createCall = mockJeRepo.create.mock.calls[0][0];
      expect(createCall.total_debit).toBe(999);
      expect(createCall.total_credit).toBe(999);
    });

    it('should default currency to USD', async () => {
      mockRuleRepo.findOne.mockResolvedValue({ id: 'r-1', debitAccountId: 'acc-1', creditAccountId: 'acc-2' });
      mockPeriodRepo.findOne.mockResolvedValue({ id: 'fp-1', status: FiscalPeriodStatus.OPEN });
      mockJeRepo.create.mockReturnValue({ id: 'je-1' });
      mockJeRepo.save.mockResolvedValue({ id: 'je-1' });
      mockLineRepo.create.mockReturnValue({});
      mockLineRepo.save.mockResolvedValue({});
      mockLinkRepo.create.mockReturnValue({});
      mockLinkRepo.save.mockResolvedValue({});

      await service.generateJournalFromMovement(validDto);

      const createCall = mockJeRepo.create.mock.calls[0][0];
      expect(createCall.currency).toBe('USD');
    });
  });

  // ─── reconcile ─────────────────────────────────────────────
  describe('reconcile', () => {
    it('should return reconciled link when found', async () => {
      const link = { id: 'l-1', isReconciled: true };
      mockLinkRepo.find.mockResolvedValue([link]);
      mockLinkRepo.findOne = jest.fn().mockResolvedValue(link);

      const result = await service.reconcile('sm-1');

      expect(result).toEqual(link);
    });

    it('should return null when not found', async () => {
      mockLinkRepo.findOne = jest.fn().mockResolvedValue(null);

      const result = await service.reconcile('sm-missing');

      expect(result).toBeNull();
    });
  });

  // ─── generateReport ─────────────────────────────────────────
  describe('generateReport', () => {
    it('should return results from query builder', async () => {
      const results = [{ id: 'l-1' }];
      mockLinkRepo.createQueryBuilder().getMany.mockResolvedValue(results);

      const result = await service.generateReport({});

      expect(result).toEqual(results);
    });

    it('should return empty array when no results', async () => {
      mockLinkRepo.createQueryBuilder().getMany.mockResolvedValue([]);

      const result = await service.generateReport({});

      expect(result).toEqual([]);
    });
  });

  // ─── getUnreconciledMovements ───────────────────────────────
  describe('getUnreconciledMovements', () => {
    it('should return empty array (placeholder)', async () => {
      mockLinkRepo.find.mockResolvedValue([]);

      const result = await service.getUnreconciledMovements('cp-1');

      expect(result).toEqual([]);
    });
  });
});
