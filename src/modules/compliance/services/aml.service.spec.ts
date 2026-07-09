import { AmlService } from './aml.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AlertType } from '../entities/alert-type.enum';
import { AlertStatus } from '../entities/alert-status.enum';
import { AlertPriority } from '../entities/alert-priority.enum';

jest.mock('../entities/aml-alert.entity');

describe('AmlService', () => {
  let service: AmlService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
    };
    service = new AmlService(mockRepo);
  });

  // Helper: crear transacción reciente
  const recentTx = (amount: number, minutesAgo: number = 0, id: string = 'tx-1', userId: string = 'user-1') => ({
    id,
    amount,
    timestamp: new Date(Date.now() - minutesAgo * 60000),
    userId,
  });

  // ─── evaluateTransaction ─────────────────────────────────────
  describe('evaluateTransaction', () => {
    const baseInput = {
      transactionId: 'tx-new',
      amount: 5000,
      userId: 'user-1',
      timestamp: new Date(),
    };

    it('should not trigger when no previous transactions', async () => {
      const result = await service.evaluateTransaction(baseInput);
      expect(result.triggered).toBe(false);
      expect(result.alert).toBeUndefined();
    });

    it('should not trigger when previous transactions are clean', async () => {
      const result = await service.evaluateTransaction({
        ...baseInput,
        previousTransactions: [
          recentTx(15000, 30),
          recentTx(20000, 60),
        ],
      });
      expect(result.triggered).toBe(false);
    });

    it('should trigger STRUCTURING with 3+ small transactions in 24h', async () => {
      const created = { id: 'alert-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.evaluateTransaction({
        ...baseInput,
        amount: 9000,
        previousTransactions: [
          recentTx(9000, 30, 'tx-1'),
          recentTx(8000, 60, 'tx-2'),
          recentTx(7000, 90, 'tx-3'),
        ],
      });

      expect(result.triggered).toBe(true);
      expect(result.alert).toBeDefined();
    });

    it('should trigger VELOCITY with 5+ transactions in 1 hour', async () => {
      const created = { id: 'alert-2' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.evaluateTransaction({
        ...baseInput,
        amount: 15000,
        previousTransactions: [
          recentTx(15000, 5, 't1'),
          recentTx(15000, 10, 't2'),
          recentTx(15000, 15, 't3'),
          recentTx(15000, 20, 't4'),
          recentTx(15000, 25, 't5'),
        ],
      });

      expect(result.triggered).toBe(true);
      expect(result.alert).toBeDefined();
    });

    it('should trigger ROUND_TRIP when amount matches total inbound', async () => {
      const created = { id: 'alert-3' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.evaluateTransaction({
        ...baseInput,
        amount: 5000,
        counterpartyName: 'suspect',
        previousTransactions: [
          { amount: 2500, timestamp: new Date(Date.now() - 60000) },
          { amount: 2500, timestamp: new Date(Date.now() - 120000) },
        ],
      });

      expect(result.triggered).toBe(true);
      expect(result.alert).toBeDefined();
    });

    it('should trigger SMURFING with 5+ small transactions from multiple users', async () => {
      const created = { id: 'alert-4' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.evaluateTransaction({
        ...baseInput,
        amount: 4000,
        previousTransactions: [
          recentTx(4000, 5, 't1', 'user-1'),
          recentTx(4000, 10, 't2', 'user-2'),
          recentTx(4000, 15, 't3', 'user-3'),
          recentTx(4000, 20, 't4', 'user-4'),
          recentTx(4000, 25, 't5', 'user-5'),
        ],
      });

      expect(result.triggered).toBe(true);
      expect(result.alert).toBeDefined();
    });
  });

  // ─── detectStructuring ───────────────────────────────────────
  describe('detectStructuring', () => {
    it('should return null when fewer than 3 recent small transactions', async () => {
      const result = await service.detectStructuring([
        recentTx(9000, 30, 't1'),
        recentTx(8000, 60, 't2'),
      ]);
      expect(result).toBeNull();
    });

    it('should return null when total is below threshold', async () => {
      const result = await service.detectStructuring([
        recentTx(1000, 30, 't1'),
        recentTx(1000, 60, 't2'),
        recentTx(1000, 90, 't3'),
      ]);
      expect(result).toBeNull();
    });

    it('should detect structuring when 3+ small transactions total over $10k', async () => {
      const created = { id: 'alert-s' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.detectStructuring([
        recentTx(4000, 30, 't1'),
        recentTx(4000, 60, 't2'),
        recentTx(4000, 90, 't3'),
      ]);

      expect(result).toBeDefined();
      expect(result.id).toBe('alert-s');
    });
  });

  // ─── checkVelocity ──────────────────────────────────────────
  describe('checkVelocity', () => {
    it('should return null when fewer than maxTxPerHour transactions', async () => {
      const result = await service.checkVelocity([
        recentTx(1000, 5, 't1'),
        recentTx(1000, 10, 't2'),
      ]);
      expect(result).toBeNull();
    });

    it('should detect velocity when 5+ transactions in 1 hour', async () => {
      const created = { id: 'alert-v' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.checkVelocity([
        recentTx(1000, 5, 't1'),
        recentTx(1000, 10, 't2'),
        recentTx(1000, 15, 't3'),
        recentTx(1000, 20, 't4'),
        recentTx(1000, 25, 't5'),
      ]);

      expect(result).toBeDefined();
      expect(result.id).toBe('alert-v');
    });

    it('should respect custom maxTxPerHour parameter', async () => {
      const created = { id: 'alert-v2' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.checkVelocity([
        recentTx(1000, 5, 't1'),
        recentTx(1000, 10, 't2'),
        recentTx(1000, 15, 't3'),
      ], 3);

      expect(result).toBeDefined();
      expect(result.id).toBe('alert-v2');
    });
  });

  // ─── detectSmurfing ─────────────────────────────────────────
  describe('detectSmurfing', () => {
    it('should return null when fewer than 5 recent small transactions', async () => {
      const result = await service.detectSmurfing([
        recentTx(4000, 5, 't1', 'u1'),
        recentTx(4000, 10, 't2', 'u2'),
        recentTx(4000, 15, 't3', 'u3'),
        recentTx(4000, 20, 't4', 'u4'),
      ]);
      expect(result).toBeNull();
    });

    it('should return null when fewer than 3 unique users', async () => {
      const result = await service.detectSmurfing([
        recentTx(4000, 5, 't1', 'u1'),
        recentTx(4000, 10, 't2', 'u1'),
        recentTx(4000, 15, 't3', 'u2'),
        recentTx(4000, 20, 't4', 'u2'),
        recentTx(4000, 25, 't5', 'u1'),
      ]);
      expect(result).toBeNull();
    });

    it('should detect smurfing with 5+ small txs from 3+ users', async () => {
      const created = { id: 'alert-smurf' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.detectSmurfing([
        recentTx(4000, 5, 't1', 'u1'),
        recentTx(4000, 10, 't2', 'u2'),
        recentTx(4000, 15, 't3', 'u3'),
        recentTx(4000, 20, 't4', 'u1'),
        recentTx(4000, 25, 't5', 'u2'),
      ]);

      expect(result).toBeDefined();
      expect(result.id).toBe('alert-smurf');
    });
  });

  // ─── detectRoundTrip ────────────────────────────────────────
  describe('detectRoundTrip', () => {
    it('should return null when amounts differ significantly', async () => {
      const result = await service.detectRoundTrip(
        { id: 'in-1', amount: 10000 },
        { id: 'out-1', amount: 5000 },
      );
      expect(result).toBeNull();
    });

    it('should detect round-trip when amounts are within tolerance', async () => {
      const created = { id: 'alert-rt' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.detectRoundTrip(
        { id: 'in-1', amount: 10000 },
        { id: 'out-1', amount: 9950 },
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('alert-rt');
    });
  });

  // ─── generateSarReport ──────────────────────────────────────
  describe('generateSarReport', () => {
    it('should generate SAR report with ID and file URL', async () => {
      const result = await service.generateSarReport('case-1', 'Summary text');

      expect(result.generated).toBe(true);
      expect(result.sarId).toMatch(/^SAR-/);
      expect(result.fileUrl).toContain(result.sarId);
      expect(result.fileUrl).toMatch(/\.pdf$/);
    });
  });

  // ─── startInvestigation ─────────────────────────────────────
  describe('startInvestigation', () => {
    it('should throw NotFoundException if alert not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.startInvestigation('missing', 'analyst-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if alert is already resolved', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'alert-1',
        status: AlertStatus.RESOLVED,
      });
      await expect(
        service.startInvestigation('alert-1', 'analyst-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set status INVESTIGATING and assign analyst', async () => {
      const alert = { id: 'alert-1', status: AlertStatus.OPEN, assignedTo: null };
      mockRepo.findOne.mockResolvedValue(alert);
      mockRepo.save.mockResolvedValue(alert);

      const result = await service.startInvestigation('alert-1', 'analyst-1');

      expect(result.status).toBe(AlertStatus.INVESTIGATING);
      expect(result.assignedTo).toBe('analyst-1');
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  // ─── resolveAsFalsePositive ─────────────────────────────────
  describe('resolveAsFalsePositive', () => {
    it('should throw NotFoundException if alert not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.resolveAsFalsePositive('missing', 'analyst-1', 'reason'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if alert is not in INVESTIGATING state', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'alert-1',
        status: AlertStatus.OPEN,
      });
      await expect(
        service.resolveAsFalsePositive('alert-1', 'analyst-1', 'reason'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should resolve as false positive with notes', async () => {
      const alert = {
        id: 'alert-1',
        status: AlertStatus.INVESTIGATING,
        falsePositive: false,
        assignedTo: null,
        resolvedAt: null,
        resolutionNotes: null,
      };
      mockRepo.findOne.mockResolvedValue(alert);
      mockRepo.save.mockResolvedValue(alert);

      const result = await service.resolveAsFalsePositive('alert-1', 'analyst-1', 'Legitimate transaction');

      expect(result.status).toBe(AlertStatus.RESOLVED);
      expect(result.falsePositive).toBe(true);
      expect(result.assignedTo).toBe('analyst-1');
      expect(result.resolvedAt).toBeDefined();
      expect(result.resolutionNotes).toContain('FALSE POSITIVE');
      expect(result.resolutionNotes).toContain('Legitimate transaction');
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  // ─── escalateAlert ──────────────────────────────────────────
  describe('escalateAlert', () => {
    it('should throw NotFoundException if alert not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.escalateAlert('missing', 'reason'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set status ESCALATED and priority CRITICAL', async () => {
      const alert = {
        id: 'alert-1',
        status: AlertStatus.INVESTIGATING,
        priority: AlertPriority.MEDIUM,
        description: 'Original description',
      };
      mockRepo.findOne.mockResolvedValue(alert);
      mockRepo.save.mockResolvedValue(alert);

      const result = await service.escalateAlert('alert-1', 'Needs senior review');

      expect(result.status).toBe(AlertStatus.ESCALATED);
      expect(result.priority).toBe(AlertPriority.CRITICAL);
      expect(result.description).toContain('[ESCALATION]');
      expect(result.description).toContain('Needs senior review');
      expect(result.description).toContain('Original description');
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  // ─── submitToRegulator ──────────────────────────────────────
  describe('submitToRegulator', () => {
    it('should submit to regulator and return submission reference', async () => {
      const result = await service.submitToRegulator('SAR-123', 'FINCEN');

      expect(result.submitted).toBe(true);
      expect(result.submissionRef).toContain('FINCEN');
      expect(result.submittedAt).toBeDefined();
    });
  });

  // ─── getActiveAlerts ────────────────────────────────────────
  describe('getActiveAlerts', () => {
    it('should return all alerts when no status filter is provided', async () => {
      const alerts = [{ id: 'a1' }, { id: 'a2' }];
      mockRepo.find.mockResolvedValue(alerts);

      const result = await service.getActiveAlerts();

      expect(result).toEqual(alerts);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: {}, order: { createdAt: 'DESC' } });
    });

    it('should filter alerts by status when provided', async () => {
      const alerts = [{ id: 'a1', status: AlertStatus.OPEN }];
      mockRepo.find.mockResolvedValue(alerts);

      const result = await service.getActiveAlerts(AlertStatus.OPEN);

      expect(result).toEqual(alerts);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { status: AlertStatus.OPEN },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // ─── getById ────────────────────────────────────────────────
  describe('getById', () => {
    it('should return alert by ID', async () => {
      const alert = { id: 'alert-1', alertType: AlertType.VELOCITY };
      mockRepo.findOne.mockResolvedValue(alert);

      const result = await service.getById('alert-1');

      expect(result).toEqual(alert);
    });

    it('should throw NotFoundException when alert not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findOrFail ─────────────────────────────────────────────
  describe('findOrFail', () => {
    it('should return alert when found', async () => {
      const alert = { id: 'alert-1' };
      mockRepo.findOne.mockResolvedValue(alert);
      expect(await service.findOrFail('alert-1')).toEqual(alert);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOrFail('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
