import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { GovDecisionLog } from '../entities/gov-decision-log.entity';
import { DecisionQueryDto } from '../dto/decision-query.dto';

@Injectable()
export class DecisionService {
  private readonly logger = new Logger(DecisionService.name);

  constructor(
    @InjectRepository(GovDecisionLog)
    private readonly decisionRepo: Repository<GovDecisionLog>,
  ) {}

  async log(params: {
    policyId: string;
    policyVersion: number;
    requestInput: Record<string, any>;
    decisionResult: string;
    decisionRationale: string;
    evaluationTimeMs: number;
    evaluatedEntityType?: string;
    evaluatedEntityId?: string;
    actorId?: string;
    context?: Record<string, any>;
  }): Promise<GovDecisionLog> {
    const log = this.decisionRepo.create({
      policyId: params.policyId,
      policyVersion: params.policyVersion,
      requestInput: params.requestInput,
      decisionResult: params.decisionResult as any,
      decisionRationale: params.decisionRationale,
      evaluationTimeMs: params.evaluationTimeMs,
      evaluatedEntityType: params.evaluatedEntityType,
      evaluatedEntityId: params.evaluatedEntityId,
      actorId: params.actorId,
      context: params.context || {},
    });
    const saved = await this.decisionRepo.save(log);
    this.logger.debug(
      `Decision logged: ${saved.id} — result: ${params.decisionResult} — policy: ${params.policyId} v${params.policyVersion}`,
    );
    return saved;
  }

  async findById(id: string): Promise<GovDecisionLog> {
    const decision = await this.decisionRepo.findOne({ where: { id } });
    if (!decision) throw new NotFoundException(`Decision ${id} not found`);
    return decision;
  }

  async search(query: DecisionQueryDto, limit = 50): Promise<GovDecisionLog[]> {
    const where: any = {};
    if (query.policyId) where.policyId = query.policyId;
    if (query.decisionResult) where.decisionResult = query.decisionResult;
    if (query.evaluatedEntityType)
      where.evaluatedEntityType = query.evaluatedEntityType;
    if (query.actorId) where.actorId = query.actorId;

    if (query.fromDate && query.toDate) {
      where.createdAt = Between(
        new Date(query.fromDate),
        new Date(query.toDate),
      );
    } else if (query.fromDate) {
      where.createdAt = MoreThan(new Date(query.fromDate));
    } else if (query.toDate) {
      where.createdAt = LessThan(new Date(query.toDate));
    }

    return this.decisionRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
