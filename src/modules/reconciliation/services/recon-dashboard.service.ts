import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReconMatchingBatch } from '../entities/recon-matching-batch.entity';
import { ReconInterSystemBreak } from '../entities/recon-inter-system-break.entity';
import { ReconNettingBatch } from '../entities/recon-netting-batch.entity';
import { BatchStatus } from '../entities/batch-status.enum';
import { BreakStatus } from '../entities/break-status.enum';
import { NettingStatus } from '../entities/netting-status.enum';
import { MatchStatus } from '../entities/match-status.enum';

@Injectable()
export class ReconDashboardService {
  private readonly logger = new Logger(ReconDashboardService.name);

  constructor(
    @InjectRepository(ReconMatchingBatch)
    private batchRepo: Repository<ReconMatchingBatch>,
    @InjectRepository(ReconInterSystemBreak)
    private breakRepo: Repository<ReconInterSystemBreak>,
    @InjectRepository(ReconNettingBatch)
    private nettingRepo: Repository<ReconNettingBatch>,
  ) {}

  // RECON-DASH-001: KPI dashboard match rate y tendencias
  async getMatchRateKPIs(periodStart?: string, periodEnd?: string): Promise<{
    totalBatches: number;
    completedBatches: number;
    overallMatchRate: number;
    avgProcessingTimeMs: number;
    trend: { date: string; matchRate: number }[];
  }> {
    const batches = await this.batchRepo.find({
      where: { status: BatchStatus.COMPLETED },
    });

    const totalBatches = batches.length;
    const completedBatches = batches.filter(b => b.status === BatchStatus.COMPLETED).length;
    
    let totalMatched = 0;
    let totalItems = 0;
    let totalTimeMs = 0;

    for (const batch of batches) {
      totalMatched += batch.matchedCount || 0;
      totalItems += (batch.matchedCount || 0) + (batch.unmatchedCountA || 0) + (batch.unmatchedCountB || 0);
      totalTimeMs += batch.processingTimeMs || 0;
    }

    const overallMatchRate = totalItems > 0 ? (totalMatched / totalItems) * 100 : 0;
    const avgProcessingTimeMs = totalBatches > 0 ? totalTimeMs / totalBatches : 0;

    return {
      totalBatches,
      completedBatches,
      overallMatchRate,
      avgProcessingTimeMs,
      trend: [],
    };
  }

  // RECON-DASH-002: Estado en tiempo real de reconciliaciones activas
  async getRealtimeStatus(): Promise<{
    runningBatches: number;
    openBreaks: number;
    pendingNetting: number;
    lastCompletedBatch: string | null;
    activeUsers: number;
  }> {
    const runningBatches = await this.batchRepo.count({ where: { status: BatchStatus.RUNNING } });
    const openBreaks = await this.breakRepo.count({ where: { status: BreakStatus.OPEN } });
    const pendingNetting = await this.nettingRepo.count({ where: { status: NettingStatus.CALCULATED } });
    
    const lastCompleted = await this.batchRepo.findOne({
      where: { status: BatchStatus.COMPLETED },
      order: { completedAt: 'DESC' },
    });

    return {
      runningBatches,
      openBreaks,
      pendingNetting,
      lastCompletedBatch: lastCompleted?.batchNumber || null,
      activeUsers: 0,
    };
  }

  // RECON-DASH-003: Resumen ejecutivo para leadership
  async getExecutiveSummary(periodMonth?: string): Promise<{
    matchRatePercent: number;
    outstandingBreaks: number;
    totalVolumeReconciled: number;
    breaksResolved: number;
    topIssues: { issue: string; count: number }[];
    nettingSavings: number;
  }> {
    const batches = await this.batchRepo.find();
    const breaks = await this.breakRepo.find();

    const matchedTotal = batches.reduce((sum, b) => sum + (b.matchedCount || 0), 0);
    const unmatchedTotal = batches.reduce((sum, b) => sum + (b.unmatchedCountA || 0) + (b.unmatchedCountB || 0), 0);
    const matchRate = (matchedTotal + unmatchedTotal) > 0 ? (matchedTotal / (matchedTotal + unmatchedTotal)) * 100 : 0;

    const openBreaks = breaks.filter(b => b.status === BreakStatus.OPEN).length;
    const resolvedBreaks = breaks.filter(b => b.status === BreakStatus.RESOLVED).length;
    
    const volumeReconciled = batches.reduce((sum, b) => sum + ((b.matchedCount || 0) * 1000), 0); // Placeholder

    const nettingBatches = await this.nettingRepo.find({ where: { status: NettingStatus.EXECUTED } });
    const nettingSavings = nettingBatches.reduce((sum, n) => sum + (n.grossVolumeTotal - n.netVolumeTotal), 0);

    const topIssues = [
      { issue: 'timing_difference', count: breaks.filter(b => b.breakType === 'timing').length },
      { issue: 'posting_error', count: breaks.filter(b => b.breakType === 'posting_error').length },
      { issue: 'missing_entry', count: breaks.filter(b => b.breakType === 'missing_entry').length },
    ].filter(i => i.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);

    return {
      matchRatePercent: matchRate,
      outstandingBreaks: openBreaks,
      totalVolumeReconciled: volumeReconciled,
      breaksResolved: resolvedBreaks,
      topIssues,
      nettingSavings,
    };
  }
}
