import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CrmAgentPerformance, SatisfactionTrend } from '../entities/crm-agent-performance.entity';
import { AgentPerformanceQueryDto, UpdateAgentMetricsDto } from '../dto/agent-performance.dto';

@Injectable()
export class AgentPerformanceService {
  constructor(
    @InjectRepository(CrmAgentPerformance)
    private readonly perfRepo: Repository<CrmAgentPerformance>,
  ) {}

  async getPerformanceMetrics(query: AgentPerformanceQueryDto) {
    const queryBuilder = this.perfRepo.createQueryBuilder('perf');
    
    if (query.agentId) {
      queryBuilder.andWhere('perf.agentId = :agentId', { agentId: query.agentId });
    }
    
    if (query.startDate && query.endDate) {
      const startDate = query.startDate.slice(0, 7); // YYYY-MM
      const endDate = query.endDate.slice(0, 7);
      queryBuilder.andWhere('perf.periodMonth BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }
    
    if (query.team) {
      queryBuilder.andWhere('perf.team = :team', { team: query.team });
    }
    
    const data = await queryBuilder.orderBy('perf.periodMonth', 'DESC').getMany();
    
    return {
      metrics: data,
      summary: this.aggregateMetrics(data),
    };
  }

  async getAgentPerformanceById(agentId: string, query: any) {
    const perf = await this.perfRepo.find({
      where: { agentId },
      order: { updatedAt: 'DESC' },
      take: query.limit || 30,
    });
    
    if (!perf.length) {
      throw new NotFoundException(`No performance data found for agent ${agentId}`);
    }
    
    return { agentId, performanceHistory: perf };
  }

  async updateAgentMetrics(agentId: string, dto: UpdateAgentMetricsDto) {
    const today = new Date();
    const periodMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    let record = await this.perfRepo.findOne({
      where: { agentId, periodMonth },
    });
    
    if (!record) {
      record = this.perfRepo.create({ agentId, periodMonth });
    }
    
    // Mapeo de DTO a entidad
    if (dto.callsHandled !== undefined) record.totalInteractionsHandled = dto.callsHandled;
    if (dto.ticketsResolved !== undefined) record.totalInteractionsHandled += dto.ticketsResolved;
    if (dto.satisfactionScore !== undefined) record.csatAvgRating = dto.satisfactionScore;
    if (dto.averageHandleTimeSec !== undefined) record.avgResolutionTimeSeconds = dto.averageHandleTimeSec;
    
    return this.perfRepo.save(record);
  }

  async getAgentKpiSummary(agentId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const periodMonth = thirtyDaysAgo.toISOString().slice(0, 7);
    
    const recent = await this.perfRepo.find({
      where: { agentId, periodMonth: Between(periodMonth, new Date().toISOString().slice(0, 7)) },
    });
    
    if (!recent.length) {
      return { agentId, period: 'last30days', kpis: {} };
    }
    
    return {
      agentId,
      period: 'last30days',
      kpis: {
        totalInteractions: recent.reduce((sum, r) => sum + r.totalInteractionsHandled, 0),
        avgCsat: recent.reduce((sum, r) => sum + (r.csatAvgRating || 0), 0) / recent.length,
        avgResolutionTime: recent.reduce((sum, r) => sum + (r.avgResolutionTimeSeconds || 0), 0) / recent.length,
        slaCompliance: recent.reduce((sum, r) => sum + (r.slaComplianceRatePct || 0), 0) / recent.length,
        revenueAttributed: recent.reduce((sum, r) => sum + (r.revenueAttributed || 0), 0),
      },
    };
  }

  async getTeamLeaderboard(teamId: string, period: string = 'month') {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    
    const agents = await this.perfRepo.createQueryBuilder('perf')
      .select([
        'perf.agentId',
        'perf.csatAvgRating',
        'perf.totalInteractionsHandled',
        'perf.slaComplianceRatePct',
      ])
      .where('perf.periodMonth = :period', { period: currentPeriod })
      .orderBy('perf.csatAvgRating', 'DESC')
      .limit(10)
      .getMany();
    
    return { teamId, period, leaderboard: agents };
  }

  async getSlaCompliance(startDate?: string, endDate?: string) {
    const query = this.perfRepo.createQueryBuilder('perf');
    
    if (startDate && endDate) {
      const startMonth = startDate.slice(0, 7);
      const endMonth = endDate.slice(0, 7);
      query.where('perf.periodMonth BETWEEN :start AND :end', {
        start: startMonth,
        end: endMonth,
      });
    }
    
    const data = await query.getMany();
    
    return {
      overallSlaCompliance: data.length ? 
        data.reduce((sum, r) => sum + (r.slaComplianceRatePct || 0), 0) / data.length : 0,
      breakdown: data,
    };
  }

  async getWorkloadDistribution() {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    
    const agents = await this.perfRepo.find({
      where: { periodMonth: currentPeriod },
      select: { agentId: true, totalInteractionsHandled: true, escalationsCount: true },
    });
    
    return {
      period: currentPeriod,
      agents: agents.map(a => ({
        agentId: a.agentId,
        totalInteractions: a.totalInteractionsHandled,
        escalations: a.escalationsCount,
      })),
    };
  }

  async createCoachingPlan(agentId: string, body: { focusArea: string; goals: string[]; targetDate: string }) {
    const currentPerf = await this.perfRepo.findOne({ where: { agentId } });
    
    const baseline = currentPerf ? {
      csatAvgRating: currentPerf.csatAvgRating,
      slaComplianceRatePct: currentPerf.slaComplianceRatePct,
      totalInteractionsHandled: currentPerf.totalInteractionsHandled,
    } : null;
    
    return {
      agentId,
      coachingPlan: {
        focusArea: body.focusArea,
        goals: body.goals,
        targetDate: body.targetDate,
        baseline,
        status: 'active',
        createdAt: new Date(),
      },
    };
  }

  async identifyTopPerformers(limit: number = 10) {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    
    const performers = await this.perfRepo.find({
      where: { periodMonth: currentPeriod },
      order: {
        csatAvgRating: 'DESC',
        slaComplianceRatePct: 'DESC',
      },
      take: limit,
    });
    
    return {
      period: currentPeriod,
      topPerformers: performers,
    };
  }

  async identifyNeedsImprovement(limit: number = 10) {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    
    const performers = await this.perfRepo.find({
      where: {
        periodMonth: currentPeriod,
        satisfactionTrend: SatisfactionTrend.DECLINING,
      },
      order: {
        csatAvgRating: 'ASC',
      },
      take: limit,
    });
    
    return {
      period: currentPeriod,
      needsAttention: performers,
    };
  }

  private aggregateMetrics(data: CrmAgentPerformance[]) {
    if (!data.length) return {};
    
    return {
      totalCount: data.length,
      avgInteractions: data.reduce((sum, r) => sum + r.totalInteractionsHandled, 0) / data.length,
      avgCsat: data.reduce((sum, r) => sum + (r.csatAvgRating || 0), 0) / data.length,
      avgSlaCompliance: data.reduce((sum, r) => sum + (r.slaComplianceRatePct || 0), 0) / data.length,
      avgResolutionTime: data.reduce((sum, r) => sum + (r.avgResolutionTimeSeconds || 0), 0) / data.length,
    };
  }
}
