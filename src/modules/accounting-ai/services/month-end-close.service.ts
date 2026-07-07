import { Injectable } from '@nestjs/common';

interface CloseTask {
  id: string;
  name: string;
  estimatedDurationHours: number;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed';
  blockingTasks: string[];
}

const closeTasksStore: CloseTask[] = [];

@Injectable()
export class MonthEndCloseService {
  async startMonthEnd(year: number, month: number): Promise<{ periodId: string; tasks: CloseTask[] }> {
    const periodId = `${year}-${month.toString().padStart(2, '0')}`;
    
    const predefinedTasks: CloseTask[] = [
      { id: crypto.randomUUID(), name: 'Reconcile bank accounts', estimatedDurationHours: 4, status: 'pending', blockingTasks: [] },
      { id: crypto.randomUUID(), name: 'Accrue expenses', estimatedDurationHours: 2, status: 'pending', blockingTasks: [] },
      { id: crypto.randomUUID(), name: 'Record depreciation', estimatedDurationHours: 1, status: 'pending', blockingTasks: [] },
      { id: crypto.randomUUID(), name: 'Review intercompany transactions', estimatedDurationHours: 3, status: 'pending', blockingTasks: [] },
      { id: crypto.randomUUID(), name: 'Validate revenue recognition', estimatedDurationHours: 2, status: 'pending', blockingTasks: [] },
    ];

    closeTasksStore.splice(0, closeTasksStore.length, ...predefinedTasks);
    return { periodId, tasks: predefinedTasks };
  }

  async getStatus(periodId: string): Promise<{ status: string; progress: number; estimatedCompletion: string }> {
    const completed = closeTasksStore.filter(t => t.status === 'completed').length;
    const total = closeTasksStore.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      status: progress === 100 ? 'completed' : 'in_progress',
      progress,
      estimatedCompletion: new Date(Date.now() + (total - completed) * 4 * 3600000).toISOString(),
    };
  }

  async getPendingTasks(periodId: string): Promise<CloseTask[]> {
    return closeTasksStore.filter(t => t.status !== 'completed');
  }

  async markTaskComplete(taskId: string): Promise<void> {
    const task = closeTasksStore.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
    }
  }

  async estimateTimeToClose(): Promise<number> {
    const pending = closeTasksStore.filter(t => t.status !== 'completed');
    return pending.reduce((sum, t) => sum + t.estimatedDurationHours, 0);
  }
}
