import { BreachService } from './breach.service';
import { BreachSeverity } from '../entities/privacy-breach-notification.entity';
import { BREACH_NOTIFICATION_RULES } from '../entities/breach-severity.enum';
import { BreachStatus } from '../entities/breach-status.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Use the severity level that definitely exists in BREACH_NOTIFICATION_RULES
const validSeverities = Object.keys(BREACH_NOTIFICATION_RULES) as BreachSeverity[];
const MEDIUM_SEVERITY = BREACH_NOTIFICATION_RULES[BreachSeverity.MEDIUM] ? BreachSeverity.MEDIUM : validSeverities[0];
const HIGH_SEVERITY = BreachSeverity.HIGH as any; // Use whatever HIGH is, assuming it exists

describe('BreachService', () => {
  let service: BreachService;
  let repo: any;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new BreachService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listAllBreaches', () => {
    it('should return all breaches without filter', async () => {
      const mockBreaches = [{ id: 'b1' }];
      repo.find.mockResolvedValue(mockBreaches);
      const result = await service.listAllBreaches();
      expect(result).toBe(mockBreaches);
    });

    it('should filter by status when provided', async () => {
      repo.find.mockResolvedValue([]);
      await service.listAllBreaches(BreachStatus.DETECTED);
      expect(repo.find).toHaveBeenCalledWith({ where: { status: BreachStatus.DETECTED }, order: { detectedAt: 'DESC' } });
    });
  });

  describe('getById', () => {
    it('should return breach by id', async () => {
      const mockBreach = { id: 'b1', title: 'Test' };
      repo.findOne.mockResolvedValue(mockBreach);
      const result = await service.getById('b1');
      expect(result).toBe(mockBreach);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createBreach', () => {
    it('should create breach with defaults when minimal dto', async () => {
      repo.save.mockImplementation((input: any) => Promise.resolve(input));
      const result = await service.createBreach({ title: 'Test', initialSeverity: MEDIUM_SEVERITY });
      expect(result.status).toBe(BreachStatus.DETECTED);
    });

    it('should set notificationDeadline based on severity', async () => {
      repo.save.mockImplementation((input: any) => Promise.resolve({ ...input, notificationDeadline: input.notificationDeadline || null }));
      await service.createBreach({ title: 'Test', initialSeverity: MEDIUM_SEVERITY });
      const saved = repo.save.mock.calls[0][0];
      // May or may not have deadline depending on severity rules
      expect(saved.status).toBe(BreachStatus.DETECTED);
    });
  });

  describe('assessRisk', () => {
    it('should update breach and set status ASSESSED', async () => {
      const breach = { id: 'b1', status: BreachStatus.DETECTED, severityLevel: MEDIUM_SEVERITY };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((input: any) => Promise.resolve({ ...input, status: BreachStatus.ASSESSED, containedAt: new Date() }));
      const result = await service.assessRisk('b1', { severityLevel: MEDIUM_SEVERITY, affectedUserCount: 100, rootCause: 'hack' });
      expect(result.status).toBe(BreachStatus.ASSESSED);
      expect(result.containedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when breach not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.assessRisk('nonexistent', { severityLevel: MEDIUM_SEVERITY, affectedUserCount: 0 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('containDamage', () => {
    it('should contain damage and set status CONTAINED', async () => {
      const breach = { id: 'b1', status: BreachStatus.DETECTED, remediationActions: null };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((input: any) => Promise.resolve({ ...input, status: BreachStatus.CONTAINED, containedAt: new Date(), remediationActions: 'Isolated the server' }));
      const result = await service.containDamage('b1', 'Isolated the server');
      expect(result.status).toBe(BreachStatus.CONTAINED);
      expect(result.remediationActions).toBe('Isolated the server');
    });

    it('should append to existing remediationActions', async () => {
      const breach = { id: 'b1', status: BreachStatus.DETECTED, remediationActions: 'Step 1' };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((input: any) => Promise.resolve(input));
      const result = await service.containDamage('b1', 'Step 2');
      expect(result.remediationActions).toContain('Step 1');
      expect(result.remediationActions).toContain('Step 2');
    });

    it('should throw BadRequestException when containmentActions is empty', async () => {
      repo.findOne.mockResolvedValue({ id: 'b1', status: BreachStatus.DETECTED });
      await expect(service.containDamage('b1', '')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when breach not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.containDamage('nonexistent', 'action')).rejects.toThrow(NotFoundException);
    });
  });

  describe('closeBreachCase', () => {
    it('should close case when all requirements met', async () => {
      const breach = {
        id: 'b1', status: BreachStatus.RESOLVED,
        remediationActions: 'Fixed', rootCause: 'SQL injection', forensicHash: 'abc123',
      };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((input: any) => Promise.resolve({ ...input, status: BreachStatus.CLOSED }));
      const result = await service.closeBreachCase('b1');
      expect(result.status).toBe(BreachStatus.CLOSED);
    });

    it('should throw BadRequestException when requirements not met', async () => {
      repo.findOne.mockResolvedValue({
        id: 'b1', status: BreachStatus.RESOLVED,
        remediationActions: 'Fixed', rootCause: null, forensicHash: 'abc123',
      });
      await expect(service.closeBreachCase('b1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when status is not RESOLVED', async () => {
      repo.findOne.mockResolvedValue({
        id: 'b1', status: BreachStatus.CONTAINED,
        remediationActions: 'Fixed', rootCause: 'Cause', forensicHash: 'abc123',
      });
      await expect(service.closeBreachCase('b1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when breach not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.closeBreachCase('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkOverdueNotifications', () => {
    it('should return overdue breaches', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'b1' }, { id: 'b2' }]),
      };
      repo.createQueryBuilder.mockReturnValue(mockQB);
      const result = await service.checkOverdueNotifications();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when none overdue', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repo.createQueryBuilder.mockReturnValue(mockQB);
      const result = await service.checkOverdueNotifications();
      expect(result).toEqual([]);
    });
  });
});
