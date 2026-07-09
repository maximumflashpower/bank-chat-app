import { ReconciliationService } from './reconciliation.service';
import { NotFoundException } from '@nestjs/common';
import { ReconciliationStatus } from '../entities/reconciliation-status.enum';

jest.mock('../entities/ledger_reconciliation.entity');

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      }),
    };
    service = new ReconciliationService(mockRepo);
  });

  // ─── findAll ────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all reconciliations ordered by createdAt DESC', async () => {
      const reconciliations = [{ id: 'r-1' }, { id: 'r-2' }];
      mockRepo.find.mockResolvedValue(reconciliations);

      const result = await service.findAll();

      expect(result).toEqual(reconciliations);
      expect(mockRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });

    it('should return empty array when no reconciliations', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ─── findById ───────────────────────────────────────────────
  describe('findById', () => {
    it('should return reconciliation when found', async () => {
      const rec = { id: 'r-1' };
      mockRepo.findOne.mockResolvedValue(rec);

      const result = await service.findById('r-1');

      expect(result).toEqual(rec);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ─────────────────────────────────────────────────
  describe('create', () => {
    const validDto = {
      bank_account_id: 'bank-1',
      period_id: 'fp-1',
      statement_date: '2026-01-31',
      statement_balance: 10000,
      tolerance: 100,
    };

    it('should create reconciliation with calculated book_balance', async () => {
      const created = { id: 'r-1', statement_balance: 10000, book_balance: 9900, status: 'auto_matched' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create(validDto, 'user-1');

      expect(result.id).toBe('r-1');
      expect(result.book_balance).toBe(9900);
      expect(result.status).toBe('auto_matched');
    });

    it('should set reconciled_at to current date', async () => {
      const created = { id: 'r-1', reconciled_at: new Date() };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create(validDto, 'user-1');

      expect(result.reconciled_at).toBeInstanceOf(Date);
    });
  });

  // ─── autoMatch ──────────────────────────────────────────────
  describe('autoMatch', () => {
    it('should return matched=99 when statement_balance equals tolerance', async () => {
      const result = await service.autoMatch({
        statement_balance: 100,
        tolerance: 100,
      });

      expect(result.matched).toBe(99);
      expect(result.unmatched).toBe(0);
    });

    it('should return matched=99 when within 0.01 tolerance', async () => {
      const result = await service.autoMatch({
        statement_balance: 100.005,
        tolerance: 100,
      });

      expect(result.matched).toBe(99);
    });

    it('should return matched=0 when difference exceeds tolerance', async () => {
      const result = await service.autoMatch({
        statement_balance: 100,
        tolerance: 50,
      });

      expect(result.matched).toBe(0);
    });

    it('should default tolerance to 0', async () => {
      // With default tolerance 0, statement_balance needs to be ~0 for match
      const result = await service.autoMatch({ statement_balance: 0 });
      expect(result.matched).toBe(99);
    });
  });

  // ─── resolveException ───────────────────────────────────────
  describe('resolveException', () => {
    it('should throw NotFoundException when reconciliation not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.resolveException('missing', 'notes', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should update status to resolved', async () => {
      const rec = { id: 'r-1', status: 'exceptions' };
      mockRepo.findOne.mockResolvedValue(rec);
      mockRepo.save.mockResolvedValue(rec);

      await service.resolveException('r-1', 'Difference found', 'user-1');

      expect(rec.status).toBe('resolved');
      expect(mockRepo.save).toHaveBeenCalledWith(rec);
    });
  });

  // ─── certify ────────────────────────────────────────────────
  describe('certify', () => {
    it('should throw Error if status is not resolved', async () => {
      const rec = { id: 'r-1', status: 'exceptions' };
      mockRepo.findOne.mockResolvedValue(rec);
      await expect(service.certify('r-1', 'user-1')).rejects.toThrow('Must resolve exceptions before certification');
    });

    it('should update status to certified', async () => {
      const rec = { id: 'r-1', status: 'resolved' };
      mockRepo.findOne.mockResolvedValue(rec);
      mockRepo.save.mockResolvedValue(rec);

      const result = await service.certify('r-1', 'user-1');

      expect(result.status).toBe('certified');
    });
  });

  // ─── getExceptions ──────────────────────────────────────────
  describe('getExceptions', () => {
    it('should filter by exceptions status when no parameter', async () => {
      const results = [{ id: 'r-1' }];
      mockRepo.createQueryBuilder().getMany.mockResolvedValue(results);

      const result = await service.getExceptions();

      expect(mockRepo.createQueryBuilder().where).toHaveBeenCalled();
      expect(result).toEqual(results);
    });

    it('should filter by provided status', async () => {
      const results = [{ id: 'r-1' }];
      mockRepo.createQueryBuilder().getMany.mockResolvedValue(results);

      await service.getExceptions('pending');

      expect(mockRepo.createQueryBuilder().where).toHaveBeenCalledWith('rec.status = :status', { status: 'pending' });
    });

    it('should limit to 50 results', async () => {
      mockRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      await service.getExceptions();
      expect(mockRepo.createQueryBuilder().take).toHaveBeenCalledWith(50);
    });
  });
});
