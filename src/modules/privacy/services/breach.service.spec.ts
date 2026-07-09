jest.mock('../entities/breach-notification.entity');

import { BreachService } from './breach.service';
import { BreachSeverity, BREACH_NOTIFICATION_RULES } from '../entities/breach-severity.enum';
import { BreachStatus } from '../entities/breach-status.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Dynamically find severity levels based on actual rules
const sevKeys = Object.keys(BREACH_NOTIFICATION_RULES) as BreachSeverity[];
const authSeverity = sevKeys.find(s => BREACH_NOTIFICATION_RULES[s].notifyAuthority)!;
const noAuthSeverity = sevKeys.find(s => !BREACH_NOTIFICATION_RULES[s].notifyAuthority)!;
const userSeverity = sevKeys.find(s => BREACH_NOTIFICATION_RULES[s].notifyUsers)!;
const noUserSeverity = sevKeys.find(s => !BREACH_NOTIFICATION_RULES[s].notifyUsers)!;

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
      expect(repo.find).toHaveBeenCalledWith({ where: {}, order: { discoveredAt: 'DESC' } });
    });

    it('should filter by status when provided', async () => {
      repo.find.mockResolvedValue([]);
      await service.listAllBreaches(BreachStatus.DETECTED);
      expect(repo.find).toHaveBeenCalledWith({ where: { status: BreachStatus.DETECTED }, order: { discoveredAt: 'DESC' } });
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
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      await service.createBreach({ title: 'Test', initialSeverity: authSeverity });
      const savedArg = repo.save.mock.calls[0][0];
      expect(savedArg.status).toBe(BreachStatus.DETECTED);
      expect(savedArg.detectionSource).toBe('manual');
      expect(savedArg.affectedUserCount).toBe(0);
      expect(savedArg.containedAt).toBeNull();
      expect(savedArg.forensicHash).toBeNull();
      expect(savedArg.authorityNotifiedAt).toBeNull();
      expect(savedArg.usersNotifiedAt).toBeNull();
    });

    it('should set notificationDeadline when severity requires authority notification', async () => {
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      await service.createBreach({ title: 'High', initialSeverity: authSeverity });
      expect(repo.save.mock.calls[0][0].notificationDeadline).toBeInstanceOf(Date);
    });

    it('should set notificationDeadline to null when severity does not require authority notification', async () => {
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      await service.createBreach({ title: 'Low', initialSeverity: noAuthSeverity });
      expect(repo.save.mock.calls[0][0].notificationDeadline).toBeNull();
    });

    it('should use provided detectionSource and affectedUserCount', async () => {
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      await service.createBreach({ title: 'Test', initialSeverity: authSeverity, detectionSource: 'ids', affectedUserCount: 42 });
      const savedArg = repo.save.mock.calls[0][0];
      expect(savedArg.detectionSource).toBe('ids');
      expect(savedArg.affectedUserCount).toBe(42);
    });
  });

  describe('assessRisk', () => {
    it('should update breach with assessment data and set status ASSESSED', async () => {
      const breach = { id: 'b1', status: BreachStatus.DETECTED, severityLevel: noAuthSeverity };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const dto = { severityLevel: authSeverity, affectedUserCount: 100, rootCause: 'hack' };
      const result = await service.assessRisk('b1', dto);
      expect(result.status).toBe(BreachStatus.ASSESSED);
      expect(result.severityLevel).toBe(authSeverity);
      expect(result.affectedUserCount).toBe(100);
      expect(result.containedAt).toBeInstanceOf(Date);
    });

    it('should set notificationDeadline when new severity requires authority notification', async () => {
      const breach = { id: 'b1', status: BreachStatus.DETECTED, severityLevel: noAuthSeverity };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      await service.assessRisk('b1', { severityLevel: authSeverity, affectedUserCount: 10 });
      expect(repo.save.mock.calls[0][0].notificationDeadline).toBeInstanceOf(Date);
    });

    it('should set notificationDeadline to null when new severity does not require authority notification', async () => {
      const breach = { id: 'b1', status: BreachStatus.DETECTED, severityLevel: authSeverity };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      await service.assessRisk('b1', { severityLevel: noAuthSeverity, affectedUserCount: 10 });
      expect(repo.save.mock.calls[0][0].notificationDeadline).toBeNull();
    });

    it('should throw NotFoundException when breach not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.assessRisk('nonexistent', { severityLevel: authSeverity, affectedUserCount: 0 }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('notifySupervisoryAuthority', () => {
    it('should notify authority and set status NOTIFIED_AUTHORITY', async () => {
      const breach = { id: 'b1', status: BreachStatus.ASSESSED, severityLevel: authSeverity, discoveredAt: new Date(Date.now() - 3600000) };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.notifySupervisoryAuthority('b1', {});
      expect(result.status).toBe(BreachStatus.NOTIFIED_AUTHORITY);
      expect(result.authorityNotifiedAt).toBeInstanceOf(Date);
    });

    it('should append authority notes to incidentNotes', async () => {
      const breach = { id: 'b1', status: BreachStatus.ASSESSED, severityLevel: authSeverity, discoveredAt: new Date(), incidentNotes: 'Initial notes' };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.notifySupervisoryAuthority('b1', { authorityNotificationNotes: 'Authority notified' });
      expect(result.incidentNotes).toContain('Initial notes');
      expect(result.incidentNotes).toContain('Authority notified');
    });

    it('should set incidentNotes when none existed', async () => {
      const breach = { id: 'b1', status: BreachStatus.ASSESSED, severityLevel: authSeverity, discoveredAt: new Date(), incidentNotes: null };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.notifySupervisoryAuthority('b1', { authorityNotificationNotes: 'New note' });
      expect(result.incidentNotes).toContain('New note');
    });

    it('should throw BadRequestException when status is not ASSESSED', async () => {
      repo.findOne.mockResolvedValue({ id: 'b1', status: BreachStatus.DETECTED, severityLevel: authSeverity, discoveredAt: new Date() });
      await expect(service.notifySupervisoryAuthority('b1', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when breach not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.notifySupervisoryAuthority('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('notifyAffectedUsers', () => {
    const longMsg = 'This is a sufficiently long notification message to all affected users regarding the breach.';

    it('should notify users when status is ASSESSED and severity requires it', async () => {
      const breach = { id: 'b1', status: BreachStatus.ASSESSED, severityLevel: userSeverity, affectedUserCount: 50 };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.notifyAffectedUsers('b1', longMsg);
      expect(result.status).toBe(BreachStatus.NOTIFIED_USERS);
      expect(result.usersNotifiedAt).toBeInstanceOf(Date);
    });

    it('should notify users when status is NOTIFIED_AUTHORITY', async () => {
      const breach = { id: 'b1', status: BreachStatus.NOTIFIED_AUTHORITY, severityLevel: userSeverity, affectedUserCount: 50 };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.notifyAffectedUsers('b1', longMsg);
      expect(result.status).toBe(BreachStatus.NOTIFIED_USERS);
    });

    it('should throw BadRequestException when status is DETECTED', async () => {
      repo.findOne.mockResolvedValue({ id: 'b1', status: BreachStatus.DETECTED, severityLevel: userSeverity });
      await expect(service.notifyAffectedUsers('b1', 'A'.repeat(60))).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when severity does not require user notification', async () => {
      repo.findOne.mockResolvedValue({ id: 'b1', status: BreachStatus.ASSESSED, severityLevel: noUserSeverity });
      await expect(service.notifyAffectedUsers('b1', 'A'.repeat(60))).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when message is too short (<50 chars)', async () => {
      repo.findOne.mockResolvedValue({ id: 'b1', status: BreachStatus.ASSESSED, severityLevel: userSeverity });
      await expect(service.notifyAffectedUsers('b1', 'short')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when breach not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.notifyAffectedUsers('nonexistent', 'A'.repeat(60))).rejects.toThrow(NotFoundException);
    });
  });

  describe('containDamage', () => {
    it('should contain damage and set status CONTAINED', async () => {
      const breach = { id: 'b1', status: BreachStatus.DETECTED, remediationActions: null };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.containDamage('b1', 'Isolated the server');
      expect(result.status).toBe(BreachStatus.CONTAINED);
      expect(result.containedAt).toBeInstanceOf(Date);
      expect(result.remediationActions).toBe('Isolated the server');
    });

    it('should append to existing remediationActions', async () => {
      const breach = { id: 'b1', status: BreachStatus.DETECTED, remediationActions: 'Step 1' };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
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
      expect(mockQB.where).toHaveBeenCalled();
      expect(mockQB.andWhere).toHaveBeenCalled();
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

  describe('closeBreachCase', () => {
    it('should close case when all requirements met', async () => {
      const breach = {
        id: 'b1', status: BreachStatus.RESOLVED,
        remediationActions: 'Fixed', rootCause: 'SQL injection', forensicHash: 'abc123',
      };
      repo.findOne.mockResolvedValue(breach);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
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
});
