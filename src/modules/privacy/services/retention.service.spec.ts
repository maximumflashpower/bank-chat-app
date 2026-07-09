jest.mock('../entities/retention-schedule.entity');

import { RetentionService } from './retention.service';
import { RetentionAction } from '../entities/retention-action.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('RetentionService', () => {
  let service: RetentionService;
  let repo: any;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    service = new RetentionService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSchedule', () => {
    it('should create schedule with defaults', async () => {
      const dto = { scheduleName: 'Test', targetTable: 'users', retentionDays: 30 };
      const mockCreated = { id: 's1', ...dto, isActive: true };
      repo.create.mockReturnValue(mockCreated);
      repo.save.mockResolvedValue(mockCreated);

      const result = await service.createSchedule(dto);
      expect(result).toBe(mockCreated);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        scheduleName: 'Test',
        targetTable: 'users',
        retentionDays: 30,
        startDateField: 'created_at',
        expirationAction: RetentionAction.ANONYMIZE,
        gracePeriodDays: 0,
        mandatoryLegalRequirement: false,
        isActive: true,
        approvedBy: null,
        approvalDate: null,
        lastExecutionAt: null,
        recordsProcessedLastRun: 0,
        nextScheduledRun: expect.any(Date),
      }));
    });

    it('should use provided values over defaults', async () => {
      const dto = {
        scheduleName: 'Legal', targetTable: 'transactions', retentionDays: 365,
        startDateField: 'transaction_date', expirationAction: RetentionAction.SECURE_DELETE,
        gracePeriodDays: 7, mandatoryLegalRequirement: true, legalReference: 'GDPR Art. 5',
        lastActivityField: 'last_login',
      };
      const mockCreated = { id: 's1', ...dto };
      repo.create.mockReturnValue(mockCreated);
      repo.save.mockResolvedValue(mockCreated);

      await service.createSchedule(dto);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        startDateField: 'transaction_date',
        expirationAction: RetentionAction.SECURE_DELETE,
        gracePeriodDays: 7,
        mandatoryLegalRequirement: true,
        legalReference: 'GDPR Art. 5',
        lastActivityField: 'last_login',
      }));
    });
  });

  describe('listSchedules', () => {
    it('should return all schedules when activeOnly=false', async () => {
      const mockSchedules = [{ id: 's1' }, { id: 's2' }];
      repo.find.mockResolvedValue(mockSchedules);
      const result = await service.listSchedules();
      expect(result).toBe(mockSchedules);
      expect(repo.find).toHaveBeenCalledWith({ where: {}, order: { createdAt: 'DESC' } });
    });

    it('should return only active schedules when activeOnly=true', async () => {
      repo.find.mockResolvedValue([]);
      await service.listSchedules(true);
      expect(repo.find).toHaveBeenCalledWith({ where: { isActive: true }, order: { createdAt: 'DESC' } });
    });
  });

  describe('getById', () => {
    it('should return schedule by id', async () => {
      const mockSchedule = { id: 's1', scheduleName: 'Test' };
      repo.findOne.mockResolvedValue(mockSchedule);
      const result = await service.getById('s1');
      expect(result).toBe(mockSchedule);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule fields', async () => {
      const existing = { id: 's1', retentionDays: 30, scheduleName: 'Old' };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.updateSchedule('s1', { scheduleName: 'New' });
      expect(result.scheduleName).toBe('New');
      expect(result.nextScheduledRun).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException when updating retentionDays on mandatory legal schedule', async () => {
      repo.findOne.mockResolvedValue({ id: 's1', mandatoryLegalRequirement: true, retentionDays: 365 });
      await expect(service.updateSchedule('s1', { retentionDays: 30 }))
        .rejects.toThrow(BadRequestException);
    });

    it('should allow updating other fields on mandatory legal schedule', async () => {
      const existing = { id: 's1', mandatoryLegalRequirement: true, retentionDays: 365, scheduleName: 'Old' };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.updateSchedule('s1', { scheduleName: 'Updated' });
      expect(result.scheduleName).toBe('Updated');
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.updateSchedule('nonexistent', { scheduleName: 'X' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleActive', () => {
    it('should toggle from true to false', async () => {
      repo.findOne.mockResolvedValue({ id: 's1', isActive: true });
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.toggleActive('s1');
      expect(result.isActive).toBe(false);
    });

    it('should toggle from false to true', async () => {
      repo.findOne.mockResolvedValue({ id: 's1', isActive: false });
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.toggleActive('s1');
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.toggleActive('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('executeExpiredRetentions', () => {
    it('should return summary with 0 schedules when none active', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.executeExpiredRetentions();
      expect(result.executedSchedules).toBe(0);
      expect(result.totalRecordsProcessed).toBe(0);
      expect(result.details).toEqual([]);
    });

    it('should process active schedules and update them', async () => {
      const schedules = [
        { id: 's1', targetTable: 'users', expirationAction: 'ANONYMIZE', retentionDays: 30 },
        { id: 's2', targetTable: 'logs', expirationAction: 'secure_delete', retentionDays: 90 },
      ];
      repo.find.mockResolvedValue(schedules);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));

      const result = await service.executeExpiredRetentions();
      expect(result.executedSchedules).toBe(2);
      expect(result.details).toHaveLength(2);
      expect(result.details[0]).toHaveProperty('scheduleId');
      expect(result.details[0]).toHaveProperty('table');
      expect(result.details[0]).toHaveProperty('recordsFound');
      expect(result.details[0]).toHaveProperty('action');
      expect(repo.save).toHaveBeenCalledTimes(2);
    });

    it('should set lastExecutionAt and recordsProcessedLastRun on each schedule', async () => {
      const schedule = { id: 's1', targetTable: 'users', expirationAction: 'ANONYMIZE', retentionDays: 30 };
      repo.find.mockResolvedValue([schedule]);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      await service.executeExpiredRetentions();
      expect(schedule.lastExecutionAt).toBeInstanceOf(Date);
      expect(schedule.nextScheduledRun).toBeInstanceOf(Date);
    });
  });

  describe('deleteSchedule', () => {
    it('should delete non-mandatory schedule', async () => {
      const schedule = { id: 's1', mandatoryLegalRequirement: false };
      repo.findOne.mockResolvedValue(schedule);
      repo.remove.mockResolvedValue(undefined);
      await service.deleteSchedule('s1');
      expect(repo.remove).toHaveBeenCalledWith(schedule);
    });

    it('should throw BadRequestException for mandatory legal schedule', async () => {
      repo.findOne.mockResolvedValue({ id: 's1', mandatoryLegalRequirement: true });
      await expect(service.deleteSchedule('s1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.deleteSchedule('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveSchedule', () => {
    it('should set approvedBy and approvalDate', async () => {
      repo.findOne.mockResolvedValue({ id: 's1', approvedBy: null, approvalDate: null });
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.approveSchedule('s1', 'DPO Alice');
      expect(result.approvedBy).toBe('DPO Alice');
      expect(result.approvalDate).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.approveSchedule('nonexistent', 'name')).rejects.toThrow(NotFoundException);
    });
  });
});
