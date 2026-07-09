import { JournalEntryService } from './journal-entry.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JournalEntryStatus } from '../entities/journal-entry-status.enum';

jest.mock('../entities/ledger_journal_entry.entity');
jest.mock('../entities/ledger_journal_line.entity');
jest.mock('../entities/ledger_fiscal_period.entity');

describe('JournalEntryService', () => {
  let service: JournalEntryService;
  let mockJeRepo: any;
  let mockLineRepo: any;
  let mockPeriodRepo: any;
  let mockDataSource: any;

  beforeEach(() => {
    mockJeRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), createQueryBuilder: jest.fn().mockReturnValue({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    }) };
    mockLineRepo = { find: jest.fn(), create: jest.fn(), save: jest.fn() };
    mockPeriodRepo = { findOne: jest.fn() };
    mockDataSource = { createQueryRunner: jest.fn() };
    service = new JournalEntryService(mockJeRepo, mockLineRepo, mockPeriodRepo, mockDataSource);
  });

  // ─── create ─────────────────────────────────────────────────
  describe('create', () => {
    const validDto = {
      reference: 'REF-001',
      description: 'Test entry',
      fiscal_period_id: 'fp-1',
      currency: 'USD',
      lines: [
        { account_id: 'acc-1', debit: 100, credit: 0 },
        { account_id: 'acc-2', debit: 0, credit: 100 },
      ],
    };

    it('should throw BadRequestException if debits != credits', async () => {
      await expect(
        service.create({
          ...validDto,
          lines: [{ account_id: 'acc-1', debit: 100, credit: 0 }],
        }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if fiscal period not found', async () => {
      mockPeriodRepo.findOne.mockResolvedValue(null);
      await expect(service.create(validDto, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if period is CLOSED', async () => {
      mockPeriodRepo.findOne.mockResolvedValue({ id: 'fp-1', status: 'closed', period_name: '2026-Q1' });
      await expect(service.create(validDto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if period is PERMANENT', async () => {
      mockPeriodRepo.findOne.mockResolvedValue({ id: 'fp-1', status: 'permanent', period_name: '2026-Q1' });
      await expect(service.create(validDto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should create journal entry with balanced lines', async () => {
      const mockQR = { connect: jest.fn(), startTransaction: jest.fn(), manager: { create: jest.fn(), save: jest.fn() }, commitTransaction: jest.fn(), rollbackTransaction: jest.fn(), release: jest.fn() };
      mockDataSource.createQueryRunner.mockReturnValue(mockQR);
      mockPeriodRepo.findOne.mockResolvedValue({ id: 'fp-1', status: 'open' });
      mockQR.manager.create.mockReturnValue({});
      mockQR.manager.save.mockResolvedValue({ id: 'je-1', entry_number: 'JE-001' });

      const result = await service.create(validDto, 'user-1');

      expect(result.entry_number).toBe('JE-001');
      expect(mockQR.connect).toHaveBeenCalled();
      expect(mockQR.startTransaction).toHaveBeenCalled();
      expect(mockQR.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockQR = { connect: jest.fn(), startTransaction: jest.fn(), manager: { create: jest.fn(), save: jest.fn().mockRejectedValue(new Error('DB Error')) }, commitTransaction: jest.fn(), rollbackTransaction: jest.fn(), release: jest.fn() };
      mockDataSource.createQueryRunner.mockReturnValue(mockQR);
      mockPeriodRepo.findOne.mockResolvedValue({ id: 'fp-1', status: 'open' });

      await expect(service.create(validDto, 'user-1')).rejects.toThrow('DB Error');
      expect(mockQR.rollbackTransaction).toHaveBeenCalled();
    });

    it('should include source_entity if provided', async () => {
      const dtoWithSource = { ...validDto, source_entity: 'custom-source' };
      const mockQR = { connect: jest.fn(), startTransaction: jest.fn(), manager: { create: jest.fn(), save: jest.fn() }, commitTransaction: jest.fn(), rollbackTransaction: jest.fn(), release: jest.fn() };
      mockDataSource.createQueryRunner.mockReturnValue(mockQR);
      mockPeriodRepo.findOne.mockResolvedValue({ id: 'fp-1', status: 'open' });
      mockQR.manager.create.mockReturnValue({});
      mockQR.manager.save.mockResolvedValue({ id: 'je-1' });

      await service.create(dtoWithSource, 'user-1');

      const createCall = mockQR.manager.create.mock.calls.find(c => c[1]?.source_entity === 'custom-source');
      expect(createCall).toBeDefined();
    });
  });

  // ─── findById ───────────────────────────────────────────────
  describe('findById', () => {
    it('should return entry with lines', async () => {
      const entry = { id: 'je-1', entry_number: 'JE-001' };
      const lines = [{ id: 'jl-1' }];
      mockJeRepo.findOne.mockResolvedValue(entry);
      mockLineRepo.find.mockResolvedValue(lines);

      const result = await service.findById('je-1');

      expect(result).toEqual({ ...entry, lines });
      expect(mockLineRepo.find).toHaveBeenCalledWith({ where: { journal_entry_id: 'je-1' } });
    });

    it('should throw NotFoundException when entry not found', async () => {
      mockJeRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── query ──────────────────────────────────────────────────
  describe('query', () => {
    it('should apply filters when provided', async () => {
      mockJeRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([[], 0]);

      await service.query({ fiscal_period_id: 'fp-1', status: 'posted', reference: 'REF', currency: 'USD' });

      expect(mockJeRepo.createQueryBuilder().andWhere).toHaveBeenCalledTimes(4);
    });

    it('should return empty array when no results', async () => {
      mockJeRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.query({});

      expect(result).toEqual([[], 0]);
    });
  });

  // ─── post ───────────────────────────────────────────────────
  describe('post', () => {
    it('should throw NotFoundException when entry not found', async () => {
      mockJeRepo.findOne.mockResolvedValue(null);
      await expect(service.post('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if entry is not draft', async () => {
      mockJeRepo.findOne.mockResolvedValue({ id: 'je-1', status: 'posted' });
      await expect(service.post('je-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should update entry to posted status', async () => {
      const entry = { id: 'je-1', status: 'draft' };
      mockJeRepo.findOne.mockResolvedValue(entry);
      mockJeRepo.save.mockResolvedValue(entry);

      const result = await service.post('je-1', 'user-1');

      expect(result.status).toBe('posted');
      expect(result.posted_at).toBeInstanceOf(Date);
    });
  });

  // ─── reverse ────────────────────────────────────────────────
  describe('reverse', () => {
    it('should throw NotFoundException when entry not found', async () => {
      mockJeRepo.findOne.mockResolvedValue(null);
      await expect(service.reverse('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if entry is not posted', async () => {
      mockJeRepo.findOne.mockResolvedValue({ id: 'je-1', status: 'draft' });
      await expect(service.reverse('je-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should create reversal entry with swapped debit/credit', async () => {
      const original = { id: 'je-1', entry_number: 'JE-001', status: 'posted', description: 'Original', fiscal_period_id: 'fp-1', currency: 'USD' };
      const lines = [
        { id: 'jl-1', account_id: 'acc-1', debit: 100, credit: 0, currency: 'USD' },
        { id: 'jl-2', account_id: 'acc-2', debit: 0, credit: 100, currency: 'USD' },
      ];
      mockJeRepo.findOne.mockResolvedValueOnce(original);
      mockLineRepo.find.mockResolvedValue(lines);
      mockJeRepo.findOne.mockResolvedValueOnce({ id: 'je-reversal', status: 'draft' });

      const mockQR = { connect: jest.fn(), startTransaction: jest.fn(), manager: { create: jest.fn(), save: jest.fn() }, commitTransaction: jest.fn(), rollbackTransaction: jest.fn(), release: jest.fn() };
      mockDataSource.createQueryRunner.mockReturnValue(mockQR);
      mockPeriodRepo.findOne.mockResolvedValue({ id: 'fp-1', status: 'open' });
      mockQR.manager.create.mockReturnValue({});
      mockQR.manager.save.mockResolvedValue({ id: 'je-reversal', entry_number: 'JE-002' });
      mockJeRepo.save.mockResolvedValue({ id: 'je-reversal', status: 'posted' });

      const result = await service.reverse('je-1', 'user-1');

      expect(result.id).toBe('je-reversal');
      expect(mockLineRepo.find).toHaveBeenCalledWith({ where: { journal_entry_id: 'je-1' } });
    });

    it('should update original entry to reversed status', async () => {
      const original = { id: 'je-1', entry_number: 'JE-001', status: 'posted', fiscal_period_id: 'fp-1', currency: 'USD', description: 'Original' };
      const lines = [
        { id: 'jl-1', account_id: 'acc-1', debit: 100, credit: 0, currency: 'USD' },
        { id: 'jl-2', account_id: 'acc-2', debit: 0, credit: 100, currency: 'USD' },
      ];
      mockJeRepo.findOne.mockResolvedValueOnce(original);
      mockLineRepo.find.mockResolvedValue(lines);
      mockJeRepo.findOne.mockResolvedValueOnce({ id: 'je-reversal', status: 'draft' });

      const mockQR = { connect: jest.fn(), startTransaction: jest.fn(), manager: { create: jest.fn(), save: jest.fn() }, commitTransaction: jest.fn(), rollbackTransaction: jest.fn(), release: jest.fn() };
      mockDataSource.createQueryRunner.mockReturnValue(mockQR);
      mockPeriodRepo.findOne.mockResolvedValue({ id: 'fp-1', status: 'open' });
      mockQR.manager.create.mockReturnValue({});
      mockQR.manager.save.mockResolvedValue({ id: 'je-reversal' });
      mockJeRepo.save.mockResolvedValue({ status: 'reversed' });

      await service.reverse('je-1', 'user-1');

      expect(mockJeRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'reversed' }));
    });
  });
});
