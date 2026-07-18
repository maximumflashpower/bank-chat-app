import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsolidationRun, ConsolidationStatus } from '../entities/consolidation-run.entity';
import { EntityRegistryService } from './entity-registry.service';

@Injectable()
export class ConsolidationRunService {
  private readonly logger = new Logger(ConsolidationRunService.name);

  constructor(
    @InjectRepository(ConsolidationRun)
    private readonly repo: Repository<ConsolidationRun>,
    private readonly entityRegistry: EntityRegistryService,
  ) {}

  async createRun(data: Partial<ConsolidationRun>): Promise<ConsolidationRun> {
    const runCode = data.runCode || `CONS-${Date.now()}`;
    const run = this.repo.create({
      ...data,
      runCode,
      status: ConsolidationStatus.PENDING,
      completionPercentage: 0,
    });
    const saved = await this.repo.save(run);
    this.logger.log(`Consolidation run created: ${saved.runCode}`);
    return saved;
  }

  async findById(id: string): Promise<ConsolidationRun> {
    const run = await this.repo.findOne({ where: { id } });
    if (!run) throw new NotFoundException(`Run ${id} not found`);
    return run;
  }

  async findByCode(code: string): Promise<ConsolidationRun | null> {
    return this.repo.findOne({ where: { runCode: code } });
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ data: ConsolidationRun[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async startRun(id: string): Promise<ConsolidationRun> {
    const run = await this.findById(id);
    if (run.status !== ConsolidationStatus.PENDING) {
      throw new BadRequestException(`Run ${id} is not in PENDING status`);
    }
    const scope = await this.entityRegistry.getConsolidationScope(run.parentEntityId);
    run.status = ConsolidationStatus.IN_PROGRESS;
    run.totalEntitiesConsolidated = scope.length;
    this.logger.log(`Run ${run.runCode} started with ${scope.length} entities`);
    return this.repo.save(run);
  }

  async updateProgress(id: string, percentage: number, status?: ConsolidationStatus): Promise<ConsolidationRun> {
    const run = await this.findById(id);
    run.completionPercentage = percentage;
    if (status) run.status = status;
    if (percentage >= 100 && !status) {
      run.status = ConsolidationStatus.COMPLETED;
    }
    return this.repo.save(run);
  }

  async approveRun(id: string, approverId: string): Promise<ConsolidationRun> {
    const run = await this.findById(id);
    if (run.status !== ConsolidationStatus.COMPLETED) {
      throw new BadRequestException(`Run ${id} must be COMPLETED before approval`);
    }
    run.status = ConsolidationStatus.APPROVED;
    run.approvedBy = approverId;
    run.approvedAt = new Date();
    this.logger.log(`Run ${run.runCode} approved by ${approverId}`);
    return this.repo.save(run);
  }

  async failRun(id: string, errorDetails: Record<string, unknown>): Promise<ConsolidationRun> {
    const run = await this.findById(id);
    run.status = ConsolidationStatus.FAILED;
    run.errorDetails = errorDetails;
    this.logger.error(`Run ${run.runCode} failed: ${JSON.stringify(errorDetails)}`);
    return this.repo.save(run);
  }

  async getRunStatistics(id: string): Promise<{
    entities: number;
    eliminations: number;
    translations: number;
    goodwillAdjustment: number;
    minorityInterest: number;
  }> {
    const run = await this.findById(id);
    return {
      entities: run.totalEntitiesConsolidated,
      eliminations: run.totalEliminations,
      translations: run.totalTranslations,
      goodwillAdjustment: Number(run.goodwillAdjustment),
      minorityInterest: Number(run.minorityInterestTotal),
    };
  }
}
