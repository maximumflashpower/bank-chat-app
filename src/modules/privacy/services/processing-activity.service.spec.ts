jest.mock('../entities/processing-activity.entity');

import { ProcessingActivityService } from './processing-activity.service';
import { NotFoundException } from '@nestjs/common';

describe('ProcessingActivityService', () => {
  let service: ProcessingActivityService;
  let repo: any;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new ProcessingActivityService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listAllActivities', () => {
    it('should return all activities ordered DESC', async () => {
      const mockActs = [{ id: 'a1' }, { id: 'a2' }];
      repo.find.mockResolvedValue(mockActs);
      const result = await service.listAllActivities();
      expect(result).toBe(mockActs);
      expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });
  });

  describe('getById', () => {
    it('should return activity by id', async () => {
      const mockAct = { id: 'a1', activityName: 'Test' };
      repo.findOne.mockResolvedValue(mockAct);
      const result = await service.getById('a1');
      expect(result).toBe(mockAct);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createActivity', () => {
    it('should create activity with dpoApproved false', async () => {
      const dto = { activityName: 'Test', purpose: 'Testing', dataCategories: ['personal'], dataSubjects: ['users'], legalBasis: 'consent' };
      const mockCreated = { id: 'a1', ...dto, dpoApproved: false };
      repo.create.mockReturnValue(mockCreated);
      repo.save.mockResolvedValue(mockCreated);
      const result = await service.createActivity(dto);
      expect(result).toBe(mockCreated);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ dpoApproved: false }));
    });

    it('should warn but still create when special category lacks consent basis', async () => {
      const dto = { activityName: 'Special', purpose: 'Health data', dataCategories: ['special_category'], dataSubjects: ['patients'], legalBasis: 'contract' };
      const mockCreated = { id: 'a1', ...dto, dpoApproved: false };
      repo.create.mockReturnValue(mockCreated);
      repo.save.mockResolvedValue(mockCreated);
      const result = await service.createActivity(dto);
      expect(result).toBe(mockCreated);
    });
  });

  describe('updateActivity', () => {
    it('should update and reset dpoApproved when purpose changes', async () => {
      const existing = { id: 'a1', dpoApproved: true, purpose: 'Old' };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.updateActivity('a1', { purpose: 'New' });
      expect(result.purpose).toBe('New');
      expect(result.dpoApproved).toBe(false);
    });

    it('should reset dpoApproved when dataCategories changes', async () => {
      const existing = { id: 'a1', dpoApproved: true, dataCategories: ['old'] };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.updateActivity('a1', { dataCategories: ['new'] });
      expect(result.dpoApproved).toBe(false);
    });

    it('should reset dpoApproved when legalBasis changes', async () => {
      const existing = { id: 'a1', dpoApproved: true, legalBasis: 'consent' };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.updateActivity('a1', { legalBasis: 'contract' });
      expect(result.dpoApproved).toBe(false);
    });

    it('should not reset dpoApproved when no sensitive fields change', async () => {
      const existing = { id: 'a1', dpoApproved: true, activityName: 'Old' };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.updateActivity('a1', { activityName: 'New Name' });
      expect(result.dpoApproved).toBe(true);
    });
  });

  describe('deleteActivity', () => {
    it('should remove activity', async () => {
      const mockAct = { id: 'a1' };
      repo.findOne.mockResolvedValue(mockAct);
      repo.remove.mockResolvedValue(undefined);
      await service.deleteActivity('a1');
      expect(repo.remove).toHaveBeenCalledWith(mockAct);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.deleteActivity('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySubject', () => {
    it('should query by subject using LIKE', async () => {
      const mockActs = [{ id: 'a1' }];
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockActs),
      };
      repo.createQueryBuilder.mockReturnValue(mockQB);
      const result = await service.findBySubject('customers');
      expect(result).toBe(mockActs);
      expect(mockQB.where).toHaveBeenCalledWith('"dataSubjects" LIKE :subject', { subject: '%customers%' });
    });
  });

  describe('setTransferCountries', () => {
    it('should set transfer countries and reset dpoApproved', async () => {
      const existing = { id: 'a1', dpoApproved: true, transferCountries: null };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.setTransferCountries('a1', ['US', 'EU']);
      expect(result.transferCountries).toEqual(['US', 'EU']);
      expect(result.dpoApproved).toBe(false);
    });
  });

  describe('exportForAudit', () => {
    it('should return summary without filters', async () => {
      const mockActs = [
        { id: 'a1', dpoApproved: true, transferCountries: ['US'] },
        { id: 'a2', dpoApproved: false, transferCountries: null },
      ];
      const mockQB = {
        andWhere: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockActs),
      };
      repo.createQueryBuilder.mockReturnValue(mockQB);
      const result = await service.exportForAudit();
      expect(result.totalActivities).toBe(2);
      expect(result.approvedCount).toBe(1);
      expect(result.internationalTransfers).toBe(1);
    });

    it('should filter by dpoApproved=true', async () => {
      const mockActs = [{ id: 'a1', dpoApproved: true, transferCountries: null }];
      const mockQB = {
        andWhere: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockActs),
      };
      repo.createQueryBuilder.mockReturnValue(mockQB);
      const result = await service.exportForAudit({ dpoApproved: true });
      expect(result.totalActivities).toBe(1);
      expect(result.approvedCount).toBe(1);
    });

    it('should filter by hasTransfers=true', async () => {
      const mockActs = [{ id: 'a1', dpoApproved: false, transferCountries: ['EU'] }];
      const mockQB = {
        andWhere: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockActs),
      };
      repo.createQueryBuilder.mockReturnValue(mockQB);
      const result = await service.exportForAudit({ hasTransfers: true });
      expect(result.totalActivities).toBe(1);
      expect(result.internationalTransfers).toBe(1);
    });

    it('should return zero counts when no activities', async () => {
      const mockQB = {
        andWhere: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repo.createQueryBuilder.mockReturnValue(mockQB);
      const result = await service.exportForAudit();
      expect(result.totalActivities).toBe(0);
      expect(result.approvedCount).toBe(0);
      expect(result.internationalTransfers).toBe(0);
    });
  });
});
