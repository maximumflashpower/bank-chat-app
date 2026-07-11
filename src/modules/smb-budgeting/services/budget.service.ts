import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetHeader } from '../entities/budget-header.entity';
import { BudgetLineItem } from '../entities/budget-line-item.entity';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import { UpdateBudgetDto } from '../dto/update-budget.dto';
import { BudgetStatus } from '../entities/budget-status.enum';

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(BudgetHeader)
    private budgetHeaderRepo: Repository<BudgetHeader>,
    @InjectRepository(BudgetLineItem)
    private budgetLineItemRepo: Repository<BudgetLineItem>
  ) {}

  async create(dto: CreateBudgetDto): Promise<BudgetHeader> {
    const budget = this.budgetHeaderRepo.create({
      ...dto,
      status: dto.status ?? BudgetStatus.DRAFT
    });
    return this.budgetHeaderRepo.save(budget);
  }

  async findAll(companyId: string): Promise<BudgetHeader[]> {
    return this.budgetHeaderRepo.find({
      where: { companyId },
      relations: { lineItems: true }
    });
  }

  async findById(id: string): Promise<BudgetHeader> {
    const budget = await this.budgetHeaderRepo.findOne({
      where: { id },
      relations: { lineItems: true }
    });
    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }
    return budget;
  }

  async update(id: string, dto: UpdateBudgetDto): Promise<BudgetHeader> {
    const budget = await this.findById(id);
    Object.assign(budget, dto);
    return this.budgetHeaderRepo.save(budget);
  }

  async addLineItem(lineItemDto: { budgetHeaderId: string; month: number; accountCategory: string; description: string; budgetedAmount: number }): Promise<BudgetLineItem> {
    const lineItem = this.budgetLineItemRepo.create(lineItemDto);
    return this.budgetLineItemRepo.save(lineItem);
  }

  async approveBudget(id: string, approvedBy: string): Promise<BudgetHeader> {
    const budget = await this.findById(id);
    if (budget.status === BudgetStatus.APPROVED) {
      throw new ConflictException('Budget already approved');
    }
    budget.status = BudgetStatus.APPROVED;
    budget.approvedAt = new Date();
    budget.approvedBy = approvedBy;
    return this.budgetHeaderRepo.save(budget);
  }

  async rejectBudget(id: string, reason: string): Promise<BudgetHeader> {
    const budget = await this.findById(id);
    budget.status = BudgetStatus.REJECTED;
    budget.comments = reason;
    return this.budgetHeaderRepo.save(budget);
  }

  async archiveBudget(id: string): Promise<BudgetHeader> {
    const budget = await this.findById(id);
    budget.status = BudgetStatus.ARCHIVED;
    return this.budgetHeaderRepo.save(budget);
  }

  async calculateVariance(budgetId: string): Promise<{ totalBudgeted: number; totalActual: number; variance: number }> {
    const budget = await this.findById(budgetId);
    const totalBudgeted = budget.lineItems.reduce((sum, item) => sum + item.budgetedAmount, 0);
    const totalActual = budget.lineItems.reduce((sum, item) => sum + item.actualAmount, 0);
    return { totalBudgeted, totalActual, variance: totalBudgeted - totalActual };
  }

  async getAlerts(companyId: string): Promise<{ budgetId: string; message: string }[]> {
    const budgets = await this.findAll(companyId);
    const alerts: { budgetId: string; message: string }[] = [];
    for (const budget of budgets) {
      if (budget.status !== BudgetStatus.APPROVED) {
        alerts.push({ budgetId: budget.id, message: `Budget needs approval for fiscal year ${budget.fiscalYear}` });
      }
    }
    return alerts;
  }

  async cloneBudget(sourceId: string, newDto: Partial<CreateBudgetDto>): Promise<BudgetHeader> {
    const source = await this.findById(sourceId);
    const cloned = this.budgetHeaderRepo.create({
      companyId: newDto.companyId ?? source.companyId,
      companyName: source.companyName,
      fiscalYear: newDto.fiscalYear ?? source.fiscalYear,
      currency: source.currency,
      status: BudgetStatus.DRAFT,
      startDate: newDto.startDate ? new Date(newDto.startDate) : source.startDate,
      endDate: newDto.endDate ? new Date(newDto.endDate) : source.endDate,
      totalBudgetedAmount: source.totalBudgetedAmount,
      metadata: source.metadata
    });
    const saved = await this.budgetHeaderRepo.save(cloned);

    if (source.lineItems && source.lineItems.length > 0) {
      const lineItems = source.lineItems.map(item =>
        this.budgetLineItemRepo.create({
          budgetHeaderId: saved.id,
          month: item.month,
          accountCategory: item.accountCategory,
          description: item.description,
          budgetedAmount: item.budgetedAmount,
          actualAmount: 0,
          assumptions: item.assumptions
        })
      );
      await this.budgetLineItemRepo.save(lineItems);
    }
    return saved;
  }

  async delete(id: string): Promise<void> {
    await this.budgetHeaderRepo.delete(id);
  }
}
