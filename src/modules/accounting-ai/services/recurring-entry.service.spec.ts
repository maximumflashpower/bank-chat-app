import { RecurringEntryService } from './recurring-entry.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('../entities/ai-recurring-template.entity');

describe('RecurringEntryService', () => {
  let service: RecurringEntryService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn(), update: jest.fn() };
    service = new RecurringEntryService(mockRepo);
  });

  describe('setup', () => {
    it('should create template with startDate and nextScheduledAt', async () => {
      const created = { id: 'tpl-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.setup({
        frequency: 'monthly',
        frequencyInterval: 1,
        startDate: '2026-01-15',
        autoGenerate: true,
      } as any);

      expect(result).toEqual(created);
      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.startDate).toEqual(new Date('2026-01-15'));
      expect(arg.nextScheduledAt).toEqual(new Date('2026-01-15'));
      expect(arg.frequency).toBe('monthly');
    });

    it('should set endDate when provided', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.setup({
        frequency: 'monthly',
        frequencyInterval: 1,
        startDate: '2026-01-15',
        endDate: '2026-12-31',
        autoGenerate: true,
      } as any);
      expect(mockRepo.create.mock.calls[0][0].endDate).toEqual(new Date('2026-12-31'));
    });

    it('should set endDate to undefined when not provided', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.setup({
        frequency: 'monthly',
        frequencyInterval: 1,
        startDate: '2026-01-15',
        autoGenerate: true,
      } as any);
      expect(mockRepo.create.mock.calls[0][0].endDate).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all templates', async () => {
      mockRepo.find.mockResolvedValue([{ id: 'tpl-1' }]);
      expect(await service.findAll()).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return template when found', async () => {
      const tpl = { id: 'tpl-1' };
      mockRepo.findOne.mockResolvedValue(tpl);
      expect(await service.findById('tpl-1')).toEqual(tpl);
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });
  });

  describe('generateDueEntries', () => {
    it('should generate entries for due templates with autoGenerate=true', async () => {
      const pastDate = new Date('2020-01-01');
      mockRepo.find.mockResolvedValue([
        { id: 'tpl-1', nextScheduledAt: pastDate, endDate: null, autoGenerate: true, frequency: 'monthly', frequencyInterval: 1, generatedCount: 5 },
      ]);

      const result = await service.generateDueEntries();

      expect(result.generated).toBe(1);
      expect(mockRepo.update).toHaveBeenCalledWith('tpl-1', expect.objectContaining({
        generatedCount: 6,
        lastGeneratedAt: expect.any(Date),
        nextScheduledAt: expect.any(Date),
      }));
    });

    it('should skip templates with autoGenerate=false', async () => {
      const pastDate = new Date('2020-01-01');
      mockRepo.find.mockResolvedValue([
        { id: 'tpl-1', nextScheduledAt: pastDate, endDate: null, autoGenerate: false, frequency: 'monthly', frequencyInterval: 1, generatedCount: 0 },
      ]);

      const result = await service.generateDueEntries();
      expect(result.generated).toBe(0);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should skip templates with future nextScheduledAt', async () => {
      const futureDate = new Date('2030-01-01');
      mockRepo.find.mockResolvedValue([
        { id: 'tpl-1', nextScheduledAt: futureDate, endDate: null, autoGenerate: true, frequency: 'monthly', frequencyInterval: 1, generatedCount: 0 },
      ]);

      const result = await service.generateDueEntries();
      expect(result.generated).toBe(0);
    });

    it('should skip templates with expired endDate', async () => {
      const pastDate = new Date('2020-01-01');
      const expiredEnd = new Date('2020-06-01');
      mockRepo.find.mockResolvedValue([
        { id: 'tpl-1', nextScheduledAt: pastDate, endDate: expiredEnd, autoGenerate: true, frequency: 'monthly', frequencyInterval: 1, generatedCount: 0 },
      ]);

      const result = await service.generateDueEntries();
      expect(result.generated).toBe(0);
    });

    it('should skip templates with null nextScheduledAt', async () => {
      mockRepo.find.mockResolvedValue([
        { id: 'tpl-1', nextScheduledAt: null, endDate: null, autoGenerate: true, frequency: 'monthly', frequencyInterval: 1, generatedCount: 0 },
      ]);

      const result = await service.generateDueEntries();
      expect(result.generated).toBe(0);
    });

    it('should calculate nextScheduledAt for monthly + interval 1', async () => {
      const pastDate = new Date(2026, 0, 15, 12);
      mockRepo.find.mockResolvedValue([
        { id: 'tpl-1', nextScheduledAt: pastDate, endDate: null, autoGenerate: true, frequency: 'monthly', frequencyInterval: 1, generatedCount: 0 },
      ]);

      await service.generateDueEntries();

      const nextDate = mockRepo.update.mock.calls[0][1].nextScheduledAt as Date;
      expect(nextDate.getMonth()).toBe(1); // Jan → Feb
      expect(nextDate.getDate()).toBe(15);
    });

    it('should calculate nextScheduledAt for quarterly + interval 2', async () => {
      const pastDate = new Date(2026, 0, 15, 12);
      mockRepo.find.mockResolvedValue([
        { id: 'tpl-1', nextScheduledAt: pastDate, endDate: null, autoGenerate: true, frequency: 'quarterly', frequencyInterval: 2, generatedCount: 0 },
      ]);

      await service.generateDueEntries();

      const nextDate = mockRepo.update.mock.calls[0][1].nextScheduledAt as Date;
      // quarterly × 2 = 6 months forward → July
      expect(nextDate.getMonth()).toBe(6);
    });

    it('should calculate nextScheduledAt for yearly + interval 1', async () => {
      const pastDate = new Date(2026, 0, 15, 12);
      mockRepo.find.mockResolvedValue([
        { id: 'tpl-1', nextScheduledAt: pastDate, endDate: null, autoGenerate: true, frequency: 'yearly', frequencyInterval: 1, generatedCount: 0 },
      ]);

      await service.generateDueEntries();

      const nextDate = mockRepo.update.mock.calls[0][1].nextScheduledAt as Date;
      expect(nextDate.getFullYear()).toBe(2027);
    });

    it('should use default (monthly +1) for unknown frequency', async () => {
      const pastDate = new Date(2026, 0, 15, 12);
      mockRepo.find.mockResolvedValue([
        { id: 'tpl-1', nextScheduledAt: pastDate, endDate: null, autoGenerate: true, frequency: 'weekly', frequencyInterval: 1, generatedCount: 0 },
      ]);

      await service.generateDueEntries();

      const nextDate = mockRepo.update.mock.calls[0][1].nextScheduledAt as Date;
      expect(nextDate.getMonth()).toBe(1); // default → +1 month → Feb
    });

    it('should skip weekend when skipWeekend=true and next falls on Saturday', async () => {
      // 2026-01-15 is Thursday. +1 month = 2026-02-15 which is Sunday (day 0)
      const pastDate = new Date(2026, 0, 15, 12);
      mockRepo.find.mockResolvedValue([
        { id: 'tpl-1', nextScheduledAt: pastDate, endDate: null, autoGenerate: true, frequency: 'monthly', frequencyInterval: 1, generatedCount: 0, skipWeekend: true },
      ]);

      await service.generateDueEntries();

      const nextDate = mockRepo.update.mock.calls[0][1].nextScheduledAt as Date;
      // Feb 15 2026 is Sunday → +1 day → Feb 16 (Monday)
      expect(nextDate.getDay()).not.toBe(0);
      expect(nextDate.getDay()).not.toBe(6);
    });

    it('should adjust to first day of month when adjustFirstDay=true', async () => {
      const pastDate = new Date(2026, 0, 15, 12);
      mockRepo.find.mockResolvedValue([
        { id: 'tpl-1', nextScheduledAt: pastDate, endDate: null, autoGenerate: true, frequency: 'monthly', frequencyInterval: 1, generatedCount: 0, adjustFirstDay: true },
      ]);

      await service.generateDueEntries();

      const nextDate = mockRepo.update.mock.calls[0][1].nextScheduledAt as Date;
      expect(nextDate.getDate()).toBe(1);
    });
  });

  describe('deactivate', () => {
    it('should set autoGenerate=false and endDate to now', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'tpl-1' });
      await service.deactivate('tpl-1');
      const arg = mockRepo.update.mock.calls[0][1];
      expect(arg.autoGenerate).toBe(false);
      expect(arg.endDate).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when template not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.deactivate('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
