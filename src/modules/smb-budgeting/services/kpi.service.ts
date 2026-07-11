import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetHeader } from '../entities/budget-header.entity';
import { ProjectRegistry } from '../entities/project-registry.entity';
import { BudgetStatus } from '../entities/budget-status.enum';

@Injectable()
export class KpiService {
  constructor(
    @InjectRepository(BudgetHeader)
    private budgetRepo: Repository<BudgetHeader>,
    @InjectRepository(ProjectRegistry)
    private projectRepo: Repository<ProjectRegistry>
  ) {}

  async getDashboard(companyId: string): Promise<{
    totalBudgeted: number;
    totalActual: number;
    activeProjects: number;
    pendingApprovals: number;
    overallVariance: number;
  }> {
    const budgets = await this.budgetRepo.find({
      where: { companyId, status: BudgetStatus.APPROVED },
      relations: { lineItems: true }
    });
    const projects = await this.projectRepo.find({ where: { companyId } });

    const totalBudgeted = budgets.reduce((sum, b) => sum + (b.totalBudgetedAmount ?? 0), 0);
    const totalActual = budgets.reduce((sum, b) =>
      sum + (b.lineItems?.reduce((s, i) => s + i.actualAmount, 0) ?? 0), 0);

    return {
      totalBudgeted,
      totalActual,
      activeProjects: projects.filter(p => p.status === 'executing').length,
      pendingApprovals: budgets.filter(b => b.status === BudgetStatus.DRAFT).length,
      overallVariance: totalBudgeted - totalActual
    };
  }

  async getBudgetUtilization(budgetId: string): Promise<{ utilized: number; remaining: number; percentage: number }> {
    const budget = await this.budgetRepo.findOne({
      where: { id: budgetId },
      relations: { lineItems: true }
    });
    if (!budget) {
      throw new NotFoundException(`Budget ${budgetId} not found`);
    }
    const totalActual = budget.lineItems?.reduce((s, i) => s + i.actualAmount, 0) ?? 0;
    const totalBudgeted = budget.totalBudgetedAmount ?? 0;
    return {
      utilized: totalActual,
      remaining: totalBudgeted - totalActual,
      percentage: totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0
    };
  }

  async updateForecast(companyId: string, periods: { period: string; projectedValue: number }[]): Promise<{ period: string; projectedValue: number; variance: number }[]> {
    const budgets = await this.budgetRepo.find({ where: { companyId } });
    const historicalAvg = budgets.length > 0
      ? budgets.reduce((s, b) => s + (b.totalBudgetedAmount ?? 0), 0) / budgets.length
      : 0;

    return periods.map(p => ({
      period: p.period,
      projectedValue: p.projectedValue,
      variance: p.projectedValue - (historicalAvg / 12)
    }));
  }

  async getProjectHealthReport(companyId: string): Promise<{ projectName: string; status: string; budgetUtilization: number; riskLevel: string }[]> {
    const projects = await this.projectRepo.find({ where: { companyId } });
    return projects.map(p => {
      const utilization = p.budgetedAmount && p.budgetedAmount > 0
        ? ((p.actualCost ?? 0) / p.budgetedAmount) * 100
        : 0;
      return {
        projectName: p.projectName,
        status: p.status,
        budgetUtilization: utilization,
        riskLevel: p.riskLevel
      };
    });
  }
}
