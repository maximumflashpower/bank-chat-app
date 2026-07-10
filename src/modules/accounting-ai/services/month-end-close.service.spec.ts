import { MonthEndCloseService } from './month-end-close.service';

describe('MonthEndCloseService', () => {
  let service: MonthEndCloseService;

  beforeEach(() => {
    service = new MonthEndCloseService();
  });

  describe('startMonthEnd', () => {
    it('should return periodId with year-month padded', async () => {
      const result = await service.startMonthEnd(2026, 3);
      expect(result.periodId).toBe('2026-03');
    });

    it('should create 5 predefined tasks with pending status', async () => {
      const result = await service.startMonthEnd(2026, 6);
      expect(result.tasks).toHaveLength(5);
      expect(result.tasks.every(t => t.status === 'pending')).toBe(true);
    });

    it('should generate unique task IDs', async () => {
      const result = await service.startMonthEnd(2026, 1);
      const ids = result.tasks.map(t => t.id);
      expect(new Set(ids).size).toBe(5);
    });

    it('should include tasks with estimatedDurationHours', async () => {
      const result = await service.startMonthEnd(2026, 1);
      expect(result.tasks.every(t => t.estimatedDurationHours > 0)).toBe(true);
    });

    it('should pad single-digit month with leading zero', async () => {
      const result = await service.startMonthEnd(2026, 7);
      expect(result.periodId).toBe('2026-07');
    });
  });

  describe('getStatus', () => {
    it('should return in_progress with 0% when no tasks completed', async () => {
      await service.startMonthEnd(2026, 1);
      const result = await service.getStatus('2026-01');
      expect(result.status).toBe('in_progress');
      expect(result.progress).toBe(0);
    });

    it('should return completed with 100% when all tasks completed', async () => {
      const { tasks } = await service.startMonthEnd(2026, 1);
      for (const t of tasks) await service.markTaskComplete(t.id);
      const result = await service.getStatus('2026-01');
      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
    });

    it('should return partial progress when some tasks completed', async () => {
      const { tasks } = await service.startMonthEnd(2026, 1);
      await service.markTaskComplete(tasks[0].id);
      const result = await service.getStatus('2026-01');
      expect(result.status).toBe('in_progress');
      expect(result.progress).toBe(20); // 1/5 = 20%
    });

    it('should return estimatedCompletion as ISO string', async () => {
      await service.startMonthEnd(2026, 1);
      const result = await service.getStatus('2026-01');
      expect(typeof result.estimatedCompletion).toBe('string');
      expect(() => new Date(result.estimatedCompletion)).not.toThrow();
    });
  });

  describe('getPendingTasks', () => {
    it('should return all tasks when none completed', async () => {
      await service.startMonthEnd(2026, 1);
      const result = await service.getPendingTasks('2026-01');
      expect(result).toHaveLength(5);
    });

    it('should return fewer tasks after completing some', async () => {
      const { tasks } = await service.startMonthEnd(2026, 1);
      await service.markTaskComplete(tasks[0].id);
      await service.markTaskComplete(tasks[1].id);
      const result = await service.getPendingTasks('2026-01');
      expect(result).toHaveLength(3);
    });

    it('should return empty when all completed', async () => {
      const { tasks } = await service.startMonthEnd(2026, 1);
      for (const t of tasks) await service.markTaskComplete(t.id);
      const result = await service.getPendingTasks('2026-01');
      expect(result).toHaveLength(0);
    });
  });

  describe('markTaskComplete', () => {
    it('should complete a task without error', async () => {
      const { tasks } = await service.startMonthEnd(2026, 1);
      await expect(service.markTaskComplete(tasks[0].id)).resolves.toBeUndefined();
    });

    it('should not throw for unknown taskId', async () => {
      await service.startMonthEnd(2026, 1);
      await expect(service.markTaskComplete('unknown-id')).resolves.toBeUndefined();
    });
  });

  describe('estimateTimeToClose', () => {
    it('should return total hours of pending tasks', async () => {
      await service.startMonthEnd(2026, 1);
      const result = await service.estimateTimeToClose();
      // 4 + 2 + 1 + 3 + 2 = 12
      expect(result).toBe(12);
    });

    it('should return 0 when all tasks completed', async () => {
      const { tasks } = await service.startMonthEnd(2026, 1);
      for (const t of tasks) await service.markTaskComplete(t.id);
      const result = await service.estimateTimeToClose();
      expect(result).toBe(0);
    });

    it('should return partial hours when some completed', async () => {
      const { tasks } = await service.startMonthEnd(2026, 1);
      // Complete first task (4 hours)
      await service.markTaskComplete(tasks[0].id);
      const result = await service.estimateTimeToClose();
      expect(result).toBe(8); // 12 - 4 = 8
    });
  });
});
