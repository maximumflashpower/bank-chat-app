import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReconInterSystemBreak } from '../entities/recon-inter-system-break.entity';
import { ReconMatchingBatch } from '../entities/recon-matching-batch.entity';
import { BreakStatus } from '../entities/break-status.enum';
import { BreakSeverity } from '../entities/break-severity.enum';
import { ReconType } from '../entities/recon-type.enum';
import { BatchStatus } from '../entities/batch-status.enum';
import { RunInterSystemDto } from '../dto/run-inter-system.dto';

@Injectable()
export class InterSystemReconService {
  private readonly logger = new Logger(InterSystemReconService.name);

  constructor(
    @InjectRepository(ReconInterSystemBreak)
    private breakRepo: Repository<ReconInterSystemBreak>,
    @InjectRepository(ReconMatchingBatch)
    private batchRepo: Repository<ReconMatchingBatch>,
  ) {}

  // RECON-IS-001: Ejecutar reconciliación inter-sistema
  async run(dto: RunInterSystemDto, userId: string): Promise<ReconMatchingBatch> {
    const batchNumber = `IS-${Date.now()}`;

    const batch = this.batchRepo.create(Object.assign(new ReconMatchingBatch(), {
      batchNumber,
      reconType: ReconType.INTER_SYSTEM,
      sourceSystemA: 'ledger',
      sourceSystemB: 'subledger',
      periodStartDate: new Date(dto.periodStart),
      periodEndDate: new Date(dto.periodEnd),
      status: BatchStatus.RUNNING,
      initiatedBy: userId,
      startedAt: new Date(),
    }));

    await this.batchRepo.save(batch);

    // Placeholder: simulación de detección de breaks
    batch.status = BatchStatus.COMPLETED;
    batch.matchedCount = 0;
    batch.unmatchedCountA = 0;
    batch.unmatchedCountB = 0;
    batch.completedAt = new Date();

    return await this.batchRepo.save(batch);
  }

  // RECON-IS-002: Obtener breaks
  async getBreaks(batchId: string): Promise<ReconInterSystemBreak[]> {
    return await this.breakRepo.find({
      where: { batchId },
      relations: { batch: true },
    });
  }

  // RECON-IS-003: Resolver break
  async resolveBreak(breakId: string, resolutionAction: string, userId: string, adjustmentEntryId?: string): Promise<ReconInterSystemBreak> {
    const brk = await this.breakRepo.findOne({ where: { id: breakId } });

    if (!brk) {
      throw new NotFoundException(`Break ${breakId} not found`);
    }

    brk.resolutionAction = resolutionAction;
    brk.adjustmentEntryId = adjustmentEntryId || ''
    brk.status = BreakStatus.RESOLVED;
    brk.resolvedBy = userId;
    brk.resolvedAt = new Date();

    return await this.breakRepo.save(brk);
  }

  // RECON-IS-004: Escalar break
  async escalateBreak(breakId: string, reason: string): Promise<ReconInterSystemBreak> {
    const brk = await this.breakRepo.findOne({ where: { id: breakId } });

    if (!brk) {
      throw new NotFoundException(`Break ${breakId} not found`);
    }

    brk.rootCauseAnalysis = `${brk.rootCauseAnalysis || ''}\nEscalated: ${reason}`.trim();
    brk.breakSeverity = BreakSeverity.HIGH;
    brk.status = BreakStatus.ESCALATED;

    return await this.breakRepo.save(brk);
  }

  // RECON-IS-005: Asignar break
  async assignBreak(breakId: string, assignedUserId: string): Promise<ReconInterSystemBreak> {
    const brk = await this.breakRepo.findOne({ where: { id: breakId } });

    if (!brk) {
      throw new NotFoundException(`Break ${breakId} not found`);
    }

    brk.assignedTo = assignedUserId;

    return await this.breakRepo.save(brk);
  }

  // RECON-IS-006: Auto-resolver stubs (placeholder)
  async autoResolveStubs(_batchId: string): Promise<number> {
    this.logger.warn('Auto-resolve stubs feature is a stub - not yet implemented');
    return 0;
  }

  // RECON-IS-007: Métricas de breaks
  async getBreakMetrics(batchId: string): Promise<{ total: number; open: number; resolved: number; averageResolutionDays: number }> {
    const breaks = await this.breakRepo.find({ where: { batchId } });

    const total = breaks.length;
    const resolved = breaks.filter(b => b.status === BreakStatus.RESOLVED).length;
    const open = total - resolved;
    const averageResolutionDays = 0;

    return { total, open, resolved, averageResolutionDays };
  }

  // RECON-IS-008: Tendencias de breaks
  async getBreakTrend(_periodStart: string, _periodEnd: string): Promise<{ date: string; count: number }[]> {
    return [];
  }

  // RECON-IS-009: Exportar breaks
  async exportBreaks(batchId: string, format: 'csv' | 'json' = 'json'): Promise<string> {
    const breaks = await this.getBreaks(batchId);

    if (format === 'json') {
      return JSON.stringify(breaks, null, 2);
    }

    const headers = ['ID', 'Account ID', 'Ledger Balance', 'Subledger Balance', 'Variance', 'Status'];
    const rows = breaks.map(b => [
      b.id,
      b.accountId,
      b.ledgerBalance.toString(),
      b.subledgerBalance.toString(),
      b.varianceAmount.toString(),
      b.status,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
