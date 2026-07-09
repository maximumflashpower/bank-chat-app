import { FiscalPeriodService } from './fiscal-period.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FiscalPeriodStatus } from '../entities/fiscal-period-status.enum';
import { FiscalPeriodType } from '../entities/fiscal-period-type.enum';

jest.mock('../entities/ledger_fiscal_period.entity');

describe('FiscalPeriodService', () => {
  let service: FiscalPeriodService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    service = new FiscalPeriodService(mockRepo);
  });

  // ─── findAll ────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all periods ordered by start_date DESC', async () => {
      const periods = [{ id: 'p1', period_name: '2026-Q1' }, { id: 'p2', period_name: '2026-Q2' }];
      mockRepo.find.mockResolvedValue(periods);

      const result = await service.findAll();

      expect(result).toEqual(periods);
      expect(mockRepo.find).toHaveBeenCalledWith({ order: { start_date: 'DESC' } });
    });

    it('should return empty array when no periods', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ─── findById ──────────────────────────────────────────────
  describe('findById', () => {
    it('should return period when found', async () => {
      const period = { id: 'p1', period_name: '2026-Q1' };
      mockRepo.findOne.mockResolvedValue(period);

      const result = await service.findById('p1');

      expect(result).toEqual(period);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findOpenPeriods ──────────────────────────────────────
  describe('findOpenPeriods', () => {
    it('should return open periods ordered by start_date ASC', async () => {
      const periods = [{ id: 'p1', status: FiscalPeriodStatus.OPEN }];
      mockRepo.find.mockResolvedValue(periods);

      const result = await service.findOpenPeriods();

      expect(result).toEqual(periods);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { status: FiscalPeriodStatus.OPEN },
        order: { start_date: 'ASC' },
      });
    });

    it('should return empty array when no open periods', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findOpenPeriods();
      expect(result).toEqual([]);
    });
  });

  // ─── create ────────────────────────────────────────────────
  describe('create', () => {
    const validData = {
      period_name: '2026-Q1',
      fiscal_year: 2026,
      period_number: 1,
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-03-31'),
      period_type: FiscalPeriodType.QUARTER,
    };

    it('should throw BadRequestException if period name already exists', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'p1', period_name: '2026-Q1' });

      await expect(service.create(validData)).rejects.toThrow(BadRequestException);
    });

    it('should create period successfully', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const created = { id: 'p1', ...validData };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create(validData);

      expect(result.id).toBe('p1');
      expect(mockRepo.create).toHaveBeenCalledWith(validData);
    });

    it('should pass through all data fields to repo.create', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.create(validData);

      const createCall = mockRepo.create.mock.calls[0][0];
      expect(createCall.period_name).toBe('2026-Q1');
      expect(createCall.fiscal_year).toBe(2026);
      expect(createCall.period_number).toBe(1);
      expect(createCall.period_type).toBe(FiscalPeriodType.QUARTER);
    });
  });

  // ─── close ─────────────────────────────────────────────────
  describe('close', () => {
    it('should throw NotFoundException if period not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.close({ period_id: 'missing', permanent: false }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if period is already CLOSED', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'p1',
        period_name: '2026-Q1',
        status: FiscalPeriodStatus.CLOSED,
      });
      await expect(
        service.close({ period_id: 'p1', permanent: false }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if period is PERMANENT', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'p1',
        period_name: '2026-Q1',
        status: FiscalPeriodStatus.PERMANENT,
      });
      await expect(
        service.close({ period_id: 'p1', permanent: false }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should close period with CLOSED status', async () => {
      const period = {
        id: 'p1',
        period_name: '2026-Q1',
        status: FiscalPeriodStatus.OPEN,
        closed_by: null,
        closed_at: null,
      };
      mockRepo.findOne.mockResolvedValue(period);
      mockRepo.save.mockResolvedValue(period);

      const result = await service.close({ period_id: 'p1', permanent: false }, 'user-1');

      expect(result.status).toBe(FiscalPeriodStatus.CLOSED);
      expect(result.closed_by).toBe('user-1');
      expect(result.closed_at).toBeInstanceOf(Date);
    });

    it('should close period with PERMANENT status when permanent=true', async () => {
      const period = {
        id: 'p1',
        period_name: '2026-Q1',
        status: FiscalPeriodStatus.OPEN,
        closed_by: null,
        closed_at: null,
      };
      mockRepo.findOne.mockResolvedValue(period);
      mockRepo.save.mockResolvedValue(period);

      const result = await service.close({ period_id: 'p1', permanent: true }, 'user-1');

      expect(result.status).toBe(FiscalPeriodStatus.PERMANENT);
    });
  });

  // ─── reopen ───────────────────────────────────────────────
  describe('reopen', () => {
    it('should throw NotFoundException if period not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.reopen({ period_id: 'missing', justification: 'test' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if period is already OPEN', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'p1',
        period_name: '2026-Q1',
        status: FiscalPeriodStatus.OPEN,
      });
      await expect(
        service.reopen({ period_id: 'p1', justification: 'test' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if period is PERMANENT', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'p1',
        period_name: '2026-Q1',
        status: FiscalPeriodStatus.PERMANENT,
      });
      await expect(
        service.reopen({ period_id: 'p1', justification: 'test' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reopen CLOSED period and increment reopen_count', async () => {
      const period = {
        id: 'p1',
        period_name: '2026-Q1',
        status: FiscalPeriodStatus.CLOSED,
        closed_by: 'user-2',
        closed_at: new Date(),
        reopen_count: 0,
      };
      mockRepo.findOne.mockResolvedValue(period);
      mockRepo.save.mockResolvedValue(period);

      const result = await service.reopen({ period_id: 'p1', justification: 'Need to fix entries' }, 'user-1');

      expect(result.status).toBe(FiscalPeriodStatus.OPEN);
      expect(result.closed_by).toBeNull();
      expect(result.closed_at).toBeNull();
      expect(result.reopen_count).toBe(1);
    });
  });

  // ─── getStatus ─────────────────────────────────────────────
  describe('getStatus', () => {
    it('should return counts by status', async () => {
      mockRepo.find.mockResolvedValue([
        { status: FiscalPeriodStatus.OPEN },
        { status: FiscalPeriodStatus.OPEN },
        { status: FiscalPeriodStatus.CLOSED },
        { status: FiscalPeriodStatus.PERMANENT },
      ]);

      const result = await service.getStatus();

      expect(result.open).toBe(2);
      expect(result.closed).toBe(1);
      expect(result.permanent).toBe(1);
    });

    it('should return zeros when no periods exist', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.getStatus();

      expect(result.open).toBe(0);
      expect(result.closed).toBe(0);
      expect(result.permanent).toBe(0);
    });
  });
});
