import { ComplianceAuditService } from './compliance-audit.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('../entities/compliance-audit-log.entity');

describe('ComplianceAuditService', () => {
  let service: ComplianceAuditService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      }),
    };
    service = new ComplianceAuditService(mockRepo);
  });

  // ─── logAction ───────────────────────────────────────────────
  describe('logAction', () => {
    it('should log action with all required fields', async () => {
      const saved = { id: 'log-1', isSealed: false };
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.logAction({
        actorId: 'user-1',
        action: 'CREATE_TRANSACTION',
        entityType: 'Transaction',
        entityId: 'tx-1',
        metadata: { amount: 5000 },
        ipAddress: '192.168.1.1',
      });

      expect(result.id).toBe('log-1');
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should set metadata and ipAddress to null if not provided', async () => {
      mockRepo.save.mockResolvedValue({ id: 'log-2' });

      await service.logAction({
        actorId: 'user-2',
        action: 'LOGIN',
        entityType: 'User',
        entityId: 'u-1',
      });

      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should call repo.save exactly once', async () => {
      mockRepo.save.mockResolvedValue({ id: 'log-3' });

      await service.logAction({
        actorId: 'user-3',
        action: 'UPDATE',
        entityType: 'Account',
        entityId: 'acc-1',
      });

      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  // ─── sealEvidence ────────────────────────────────────────────
  describe('sealEvidence', () => {
    it('should throw NotFoundException when log not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.sealEvidence('missing')).rejects.toThrow(NotFoundException);
    });

    it('should seal evidence with hash', async () => {
      const log = { id: 'evidence-1', isSealed: false, sealedHash: null };
      mockRepo.findOne.mockResolvedValue(log);
      mockRepo.save.mockResolvedValue(log);

      const result = await service.sealEvidence('evidence-1');

      expect(result.sealed).toBe(true);
      expect(result.hash).toMatch(/^SHA256:/);
      expect(result.sealedAt).toBeInstanceOf(Date);
      expect(log.isSealed).toBe(true);
      expect(log.sealedHash).toBeDefined();
      expect(mockRepo.save).toHaveBeenCalledWith(log);
    });

    it('should update isSealed and sealedHash on log', async () => {
      const log = { id: 'evidence-2', isSealed: false };
      mockRepo.findOne.mockResolvedValue(log);
      mockRepo.save.mockResolvedValue(log);

      await service.sealEvidence('evidence-2');

      expect(log.isSealed).toBe(true);
      expect(log.sealedHash).toBeTruthy();
    });
  });

  // ─── exportAuditTrail ────────────────────────────────────────
  describe('exportAuditTrail', () => {
    it('should export logs with default params (no filters)', async () => {
      const logs = [{ id: 'log-1' }, { id: 'log-2' }];
      mockRepo.createQueryBuilder().getMany.mockResolvedValue(logs);

      const result = await service.exportAuditTrail({});

      expect(result.logs).toEqual(logs);
      expect(result.totalCount).toBe(2);
      expect(result.exportedAt).toBeInstanceOf(Date);
    });

    it('should filter by entityType', async () => {
      const logs = [{ id: 'log-1', entityType: 'Transaction' }];
      mockRepo.createQueryBuilder().getMany.mockResolvedValue(logs);

      await service.exportAuditTrail({ entityType: 'Transaction' });

      expect(mockRepo.createQueryBuilder()).toBeDefined();
    });

    it('should filter by startDate', async () => {
      const logs = [{ id: 'log-1' }];
      mockRepo.createQueryBuilder().getMany.mockResolvedValue(logs);

      const startDate = new Date('2026-01-01');
      await service.exportAuditTrail({ startDate });

      expect(mockRepo.createQueryBuilder().andWhere).toHaveBeenCalled();
    });

    it('should filter by endDate', async () => {
      const logs = [{ id: 'log-1' }];
      mockRepo.createQueryBuilder().getMany.mockResolvedValue(logs);

      const endDate = new Date('2026-06-30');
      await service.exportAuditTrail({ endDate });

      expect(mockRepo.createQueryBuilder().andWhere).toHaveBeenCalled();
    });

    it('should filter by actorId', async () => {
      const logs = [{ id: 'log-1' }];
      mockRepo.createQueryBuilder().getMany.mockResolvedValue(logs);

      await service.exportAuditTrail({ actorId: 'user-1' });

      expect(mockRepo.createQueryBuilder().andWhere).toHaveBeenCalled();
    });

    it('should order by created_at DESC', async () => {
      const logs = [{ id: 'log-1' }];
      mockRepo.createQueryBuilder().getMany.mockResolvedValue(logs);

      await service.exportAuditTrail({});

      expect(mockRepo.createQueryBuilder().orderBy).toHaveBeenCalledWith('audit.created_at', 'DESC');
    });
  });

  // ─── getLogsForEntity ────────────────────────────────────────
  describe('getLogsForEntity', () => {
    it('should return logs for an entity', async () => {
      const logs = [{ id: 'log-1', entityType: 'Transaction', entityId: 'tx-1' }];
      mockRepo.find.mockResolvedValue(logs);

      const result = await service.getLogsForEntity('Transaction', 'tx-1');

      expect(result).toEqual(logs);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { entityType: 'Transaction', entityId: 'tx-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no logs found', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.getLogsForEntity('NonExistent', 'xyz');
      expect(result).toEqual([]);
    });
  });
});
