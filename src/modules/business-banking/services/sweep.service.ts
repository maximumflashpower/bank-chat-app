import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessSweepRule, SweepType, SweepFrequency, SweepDirection } from '../entities/business-sweep-rule.entity';

@Injectable()
export class SweepService {
  private readonly logger = new Logger(SweepService.name);

  constructor(
    @InjectRepository(BusinessSweepRule)
    private readonly repo: Repository<BusinessSweepRule>,
  ) {}

  async createRule(data: Partial<BusinessSweepRule>): Promise<BusinessSweepRule> {
    const rule = this.repo.create({
      ...data,
      isActive: true,
      executionCount: 0,
      totalSweptAmount: 0,
      createdAt: new Date(),
    });

    const saved = await this.repo.save(rule);
    this.logger.log(`Sweep rule created: ${rule.ruleName}, source=${rule.sourceAccountId}`);
    return saved;
  }

  async findById(id: string): Promise<BusinessSweepRule> {
    const rule = await this.repo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException(`Sweep rule ${id} not found`);
    return rule;
  }

  async findBySourceAccount(accountId: string): Promise<BusinessSweepRule[]> {
    return this.repo.find({ where: { sourceAccountId: accountId, isActive: true } });
  }

  async deactivateRule(id: string): Promise<BusinessSweepRule> {
    const rule = await this.findById(id);
    rule.isActive = false;
    return this.repo.save(rule);
  }

  async activateRule(id: string): Promise<BusinessSweepRule> {
    const rule = await this.findById(id);
    rule.isActive = true;
    return this.repo.save(rule);
  }

  async executeSweep(ruleId: string): Promise<{ 
    executed: boolean; 
    sweptAmount: number; 
    sourceBalance: number;
    destinationBalance: number;
    message: string;
  }> {
    const rule = await this.findById(ruleId);
    
    if (!rule.isActive) {
      return { executed: false, sweptAmount: 0, sourceBalance: 0, destinationBalance: 0, message: 'Rule is inactive' };
    }

    // Placeholder: en producción, consultaría balances reales del ledger
    const sourceBalance = 10000; // Simulado
    let sweptAmount = 0;

    switch (rule.sweepType) {
      case SweepType.ZERO_BALANCE:
        sweptAmount = sourceBalance;
        break;
      case SweepType.TARGET_BALANCE:
        sweptAmount = Math.max(0, sourceBalance - (Number(rule.targetBalanceAmount) || 0));
        break;
      case SweepType.THRESHOLD:
        sweptAmount = sourceBalance > (Number(rule.thresholdAmount) || 0) 
          ? sourceBalance - (Number(rule.thresholdAmount) || 0)
          : 0;
        break;
      case SweepType.EXCESS:
        sweptAmount = Math.max(0, sourceBalance - (Number(rule.targetBalanceAmount) || 0));
        break;
    }

    if (rule.minSweepAmount && sweptAmount < Number(rule.minSweepAmount)) {
      return { executed: false, sweptAmount: 0, sourceBalance, destinationBalance: 0, message: 'Below minimum sweep amount' };
    }

    // Actualizar estadísticas del rule
    rule.executionCount += 1;
    rule.totalSweptAmount += sweptAmount;
    rule.lastExecutedAt = new Date();
    await this.repo.save(rule);

    this.logger.log(`Sweep executed: rule=${ruleId}, amount=${sweptAmount}, type=${rule.sweepType}`);

    return { executed: true, sweptAmount, sourceBalance, destinationBalance: 0, message: 'Sweep completed' };
  }

  async processScheduledSweeps(): Promise<number> {
    const now = new Date();
    const rules = await this.repo.find({ where: { isActive: true } });
    
    let executed = 0;
    for (const rule of rules) {
      const shouldExecute = this.shouldRunAtTime(rule.sweepFrequency, rule.sweepExecutionTime, now);
      if (shouldExecute) {
        await this.executeSweep(rule.id);
        executed += 1;
      }
    }

    this.logger.log(`${executed} scheduled sweeps processed`);
    return executed;
  }

  private shouldRunAtTime(frequency: SweepFrequency, executionTime: string, now: Date): boolean {
    const [hour, minute] = executionTime.split(':').map(Number);
    const nowHour = now.getHours();
    const nowMinute = now.getMinutes();

    if (nowHour !== hour || nowMinute !== minute) return false;

    const dayOfWeek = now.getDay();
    switch (frequency) {
      case SweepFrequency.DAILY:
        return true;
      case SweepFrequency.WEEKLY:
        return dayOfWeek === 1; // Monday
      case SweepFrequency.MONTHLY:
        return now.getDate() === 1;
      default:
        return false;
    }
  }

  async getExecutionHistory(ruleId: string, days: number = 30): Promise<Array<{
    executedAt: Date;
    sweptAmount: number;
    sourceBalanceBefore: number;
    sourceBalanceAfter: number;
  }>> {
    const rule = await this.findById(ruleId);
    // Placeholder - en producción consultaríamos un log de ejecuciones
    return [{
      executedAt: rule.lastExecutedAt || new Date(),
      sweptAmount: Number(rule.totalSweptAmount),
      sourceBalanceBefore: 0,
      sourceBalanceAfter: 0,
    }];
  }
}
