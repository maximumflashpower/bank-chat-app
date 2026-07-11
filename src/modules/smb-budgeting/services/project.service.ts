import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectRegistry } from '../entities/project-registry.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { ProjectStatus } from '../entities/project-status.enum';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(ProjectRegistry)
    private projectRepo: Repository<ProjectRegistry>
  ) {}

  async create(dto: CreateProjectDto): Promise<ProjectRegistry> {
    const project = this.projectRepo.create({});
    Object.assign(project, {
      companyId: dto.companyId,
      projectName: dto.projectName,
      description: dto.description,
      status: dto.status ?? ProjectStatus.INITIATING,
      riskLevel: dto.riskLevel ?? undefined,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      budgetedAmount: dto.budgetedAmount ?? undefined,
      projectManager: dto.projectManager ?? undefined,
      milestones: dto.milestones ?? undefined,
      stakeholders: dto.stakeholders ?? undefined,
      notes: dto.notes ?? undefined
    });
    return this.projectRepo.save(project);
  }

  async findAll(companyId: string): Promise<ProjectRegistry[]> {
    return this.projectRepo.find({ where: { companyId } });
  }

  async findById(id: string): Promise<ProjectRegistry> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  async update(id: string, dto: Partial<CreateProjectDto>): Promise<ProjectRegistry> {
    const project = await this.findById(id);
    Object.assign(project, dto);
    if (dto.startDate) project.startDate = new Date(dto.startDate);
    if (dto.endDate) project.endDate = new Date(dto.endDate);
    return this.projectRepo.save(project);
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<ProjectRegistry> {
    const project = await this.findById(id);
    project.status = status;
    return this.projectRepo.save(project);
  }

  async getProfitability(id: string): Promise<{ budgeted: number; actual: number; variance: number; profitabilityPercentage: number }> {
    const project = await this.findById(id);
    const budgeted = project.budgetedAmount ?? 0;
    const actual = project.actualCost ?? 0;
    const variance = budgeted - actual;
    const profitabilityPercentage = budgeted > 0 ? ((variance / budgeted) * 100) : 0;
    return { budgeted, actual, variance, profitabilityPercentage };
  }

  async updateBudget(id: string, amount: number): Promise<ProjectRegistry> {
    const project = await this.findById(id);
    project.budgetedAmount = amount;
    return this.projectRepo.save(project);
  }

  async logExpense(id: string, amount: number): Promise<ProjectRegistry> {
    const project = await this.findById(id);
    project.actualCost = (project.actualCost ?? 0) + amount;
    return this.projectRepo.save(project);
  }

  async delete(id: string): Promise<void> {
    await this.projectRepo.delete(id);
  }
}
