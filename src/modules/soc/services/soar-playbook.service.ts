import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SoarPlaybook, PlaybookExecutionMode } from '../entities/soar-playbook.entity';
import { SoarExecutionLog, ExecutionStatus } from '../entities/soar-execution-log.entity';

export interface PlaybookResult {
  executionId: string;
  status: ExecutionStatus;
  stepsExecuted: string[];
  message: string;
}

@Injectable()
export class SoarPlaybookService {
  constructor(
    @InjectRepository(SoarPlaybook)
    private playbookRepo: Repository<SoarPlaybook>,
    @InjectRepository(SoarExecutionLog)
    private executionLogRepo: Repository<SoarExecutionLog>,
  ) {}

  async createPlaybook(data: Partial<SoarPlaybook>): Promise<SoarPlaybook> {
    const playbook = this.playbookRepo.create(data);
    return this.playbookRepo.save(playbook);
  }

  async findAll(): Promise<SoarPlaybook[]> {
    return this.playbookRepo.find({ where: { enabled: true } });
  }

  async findById(id: string): Promise<SoarPlaybook | null> {
    return this.playbookRepo.findOne({ where: { id } });
  }

  async runPlaybook(
    playbookId: string,
    incidentId?: string,
    userId?: string,
  ): Promise<PlaybookResult> {
    const playbook = await this.findById(playbookId);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }
    if (!playbook.enabled) {
      throw new Error(`Playbook ${playbookId} is disabled`);
    }

    const execution = this.executionLogRepo.create({
      playbookId,
      incidentId,
      triggeredBy: userId,
      status: ExecutionStatus.RUNNING,
      startedAt: new Date(),
    });
    const saved = await this.executionLogRepo.save(execution);

    let result: PlaybookResult;

    try {
      const steps = this.executePlaybookSteps(playbook.playbookSteps, incidentId);
      
      result = {
        executionId: saved.id,
        status: ExecutionStatus.COMPLETED,
        stepsExecuted: Object.keys(steps),
        message: 'Playbook completed successfully',
      };

      execution.status = ExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.stepResults = steps;
    } catch (error) {
      result = {
        executionId: saved.id,
        status: ExecutionStatus.FAILED,
        stepsExecuted: [],
        message: error.message || 'Unknown error',
      };

      execution.status = ExecutionStatus.FAILED;
      execution.error = error.message || 'Unknown error';
    } finally {
      await this.executionLogRepo.save(execution);
    }

    return result;
  }

  private executePlaybookSteps(
    steps: Record<string, unknown>,
    incidentId?: string,
  ): Record<string, unknown> {
    const results: Record<string, unknown> = {};
    
    for (const [stepName, stepConfig] of Object.entries(steps)) {
      results[stepName] = {
        status: 'executed',
        timestamp: new Date().toISOString(),
        config: stepConfig,
      };
    }

    return results;
  }

  async getExecutionLog(executionId: string): Promise<SoarExecutionLog | null> {
    return this.executionLogRepo.findOne({ where: { id: executionId } });
  }

  async getRecentExecutions(limit?: number): Promise<SoarExecutionLog[]> {
    return this.executionLogRepo.find({
      order: { createdAt: 'DESC' },
      take: limit ?? 50,
    });
  }

  async calculateSuccessRate(playbookId: string): Promise<number> {
    const executions = await this.executionLogRepo.find({
      where: { playbookId },
    });
    
    if (executions.length === 0) return 0;
    
    const successCount = executions.filter(e => e.status === ExecutionStatus.COMPLETED).length;
    return Number(((successCount / executions.length) * 100).toFixed(2));
  }
}
