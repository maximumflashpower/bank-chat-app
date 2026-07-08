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

  // GOV-DECISION-005: Export decision rationale
  async exportRationale(id: string): Promise<{ decision: GovDecisionLog; rationale: Record<string, any> }> {
    const decision = await this.decisionRepo.findOne({ where: { id } });
    if (!decision) throw new NotFoundException(`Decision ${id} not found`);
    return {
      decision,
      rationale: {
        policyId: decision.policyId,
        evaluatedEntity: decision.evaluatedEntityType,
        result: decision.decisionResult,
        context: decision.context,
        actorId: decision.actorId,
        timestamp: decision.createdAt,
      },
    };
  }

  // GOV-DECISION-006: Advanced search with aggregation
  async advancedSearch(query: DecisionQueryDto & { result?: string; policyId?: string }): Promise<{ decisions: GovDecisionLog[]; summary: { total: number; byResult: Record<string, number> } }> {
    const where: any = {};
    if (query.actorId) where.actorId = query.actorId;
    if (query.policyId) where.policyId = query.policyId;
    if (query.decisionResult) where.decisionResult = query.result;
    if (query.fromDate && query.toDate) {
      where.createdAt = Between(new Date(query.fromDate), new Date(query.toDate));
    } else if (query.fromDate) {
      where.createdAt = MoreThan(new Date(query.fromDate));
    } else if (query.toDate) {
      where.createdAt = LessThan(new Date(query.toDate));
    }

    const decisions = await this.decisionRepo.find({ where, order: { createdAt: 'DESC' }, take: 100 });
    const byResult: Record<string, number> = {};
    for (const d of decisions) {
      const key = String(d.decisionResult ?? 'unknown');
      byResult[key] = (byResult[key] ?? 0) + 1;
    }
    return { decisions, summary: { total: decisions.length, byResult } };
  }

  // GOV-DECISION-007: Decision analytics
  async getAnalytics(fromDate?: string, toDate?: string): Promise<{ totalDecisions: number; allowCount: number; denyCount: number; reviewCount: number; topPolicies: { policyId: string; count: number }[] }> {
    const where: any = {};
    if (fromDate && toDate) {
      where.createdAt = Between(new Date(fromDate), new Date(toDate));
    } else if (fromDate) {
      where.createdAt = MoreThan(new Date(fromDate));
    }

    const decisions = await this.decisionRepo.find({ where, order: { createdAt: 'DESC' }, take: 500 });

    let allowCount = 0;
    let denyCount = 0;
    let reviewCount = 0;
    const policyCounts = new Map<string, number>();

    for (const d of decisions) {
      const result = String(d.decisionResult ?? '').toLowerCase();
      if (result.includes('allow')) allowCount++;
      else if (result.includes('deny')) denyCount++;
      else if (result.includes('review') || result.includes('manual')) reviewCount++;

      const pid = d.policyId ?? 'unknown';
      policyCounts.set(pid, (policyCounts.get(pid) ?? 0) + 1);
    }

    const topPolicies = Array.from(policyCounts.entries())
      .map(([policyId, count]) => ({ policyId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { totalDecisions: decisions.length, allowCount, denyCount, reviewCount, topPolicies };
  }

  // GOV-DECISION-008: Decision audit trail / replay
  async getAuditTrail(entityType?: string, entityId?: string): Promise<GovDecisionLog[]> {
    const where: any = {};
    if (entityType) where.evaluatedEntityType = entityType;
    if (entityId) where.evaluatedEntityId = entityId;
    return this.decisionRepo.find({ where, order: { createdAt: 'ASC' }, take: 200 });
  }
}
