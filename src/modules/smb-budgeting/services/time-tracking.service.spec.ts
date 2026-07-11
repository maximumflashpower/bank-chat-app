import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeTrackingService } from './time-tracking.service';
import { TimeEntryLog } from '../entities/time-entry-log.entity';
import { TimeApprovalStatus } from '../entities/time-approval-status.enum';
import { NotFoundException } from '@nestjs/common';

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;
  let repo: Repository<TimeEntryLog>;

  const mockEntry = {
    id: 'entry-uuid-1',
    projectId: 'project-uuid-1',
    userId: 'user-uuid-1',
    entryDate: new Date('2026-07-10'),
    hoursLogged: 8,
    taskDescription: 'Frontend dev',
    hourlyRate: 75,
    billableAmount: 600,
    approvalStatus: TimeApprovalStatus.PENDING,
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeTrackingService,
        {
          provide: getRepositoryToken(TimeEntryLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<TimeTrackingService>(TimeTrackingService);
    repo = module.get<Repository<TimeEntryLog>>(getRepositoryToken(TimeEntryLog));
  });

  afterEach(() => jest.clearAllMocks());

  describe('logTime', () => {
    it('should log time with billable amount', async () => {
      const dto = {
        projectId: 'project-uuid-1',
        userId: 'user-uuid-1',
        entryDate: '2026-07-10',
        hoursLogged: 8,
        hourlyRate: 75
      };

      jest.spyOn(repo, 'create').mockReturnValue(mockEntry as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);

      const result = await service.logTime(dto);

      expect(repo.create).toHaveBeenCalledWith({});
      expect(result.billableAmount).toBe(600);
    });

    it('should set null billableAmount without hourlyRate', async () => {
      const dto = {
        projectId: 'project-uuid-1',
        userId: 'user-uuid-1',
        entryDate: '2026-07-10',
        hoursLogged: 8
      };

      const entry = { ...mockEntry, billableAmount: null, hourlyRate: null };
      jest.spyOn(repo, 'create').mockReturnValue(entry as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);

      const result = await service.logTime(dto);

      expect(result.billableAmount).toBeNull();
    });
  });

  describe('findByProject', () => {
    it('should return entries ordered by date DESC', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([mockEntry] as any);
      const result = await service.findByProject('project-uuid-1');
      expect(repo.find).toHaveBeenCalledWith({
        where: { projectId: 'project-uuid-1' },
        order: { entryDate: 'DESC' }
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findByUser', () => {
    it('should return entries for a user', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([mockEntry] as any);
      const result = await service.findByUser('user-uuid-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('approveEntry', () => {
    it('should approve a time entry', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockEntry as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);

      const result = await service.approveEntry('entry-uuid-1', 'manager-uuid-1');

      expect(result.approvalStatus).toBe(TimeApprovalStatus.APPROVED);
      expect(result.approvedBy).toBe('manager-uuid-1');
      expect(result.approvedAt).toBeDefined();
    });

    it('should throw NotFoundException if entry not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(service.approveEntry('nope', 'mgr')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectEntry', () => {
    it('should reject a time entry with reason', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockEntry as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);

      const result = await service.rejectEntry('entry-uuid-1', 'Invalid hours');

      expect(result.approvalStatus).toBe(TimeApprovalStatus.REJECTED);
      expect(result.rejectionReason).toBe('Invalid hours');
    });
  });

  describe('getTotalHours', () => {
    it('should sum all hours for a project', async () => {
      const entries = [
        { ...mockEntry, hoursLogged: 8 },
        { ...mockEntry, hoursLogged: 4 }
      ];
      jest.spyOn(repo, 'find').mockResolvedValue(entries as any);
      const result = await service.getTotalHours('project-uuid-1');
      expect(result).toBe(12);
    });
  });

  describe('getTotalBillableAmount', () => {
    it('should sum all billable amounts', async () => {
      const entries = [
        { ...mockEntry, billableAmount: 600 },
        { ...mockEntry, billableAmount: 300 }
      ];
      jest.spyOn(repo, 'find').mockResolvedValue(entries as any);
      const result = await service.getTotalBillableAmount('project-uuid-1');
      expect(result).toBe(900);
    });
  });
});
