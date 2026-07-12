import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReconSettlementBatch } from '../entities/recon-settlement-batch.entity';
import { SettlementStatus } from '../entities/settlement-status.enum';
import { OptimizeSettlementDto } from '../dto/optimize-settlement.dto';

@Injectable()
export class SettlementOptimizerService {
  private readonly logger = new Logger(SettlementOptimizerService.name);

  constructor(
    @InjectRepository(ReconSettlementBatch)
    private batchRepo: Repository<ReconSettlementBatch>,
  ) {}

  // RECON-SET-001: Optimizar batch settlement
  async optimizeBatch(dto: OptimizeSettlementDto, userId: string): Promise<ReconSettlementBatch> {
    const batchNumber = `SB-${Date.now()}`;

    const batch = this.batchRepo.create(Object.assign(new ReconSettlementBatch(), {
      settlementBatchNumber: batchNumber,
      optimizationStrategy: dto.optimizationStrategy,
      bankChannel: dto.bankChannel || 'default',
      currencyCode: dto.currencyCode,
      totalPaymentsCount: dto.payments?.length || 0,
      totalGrossAmount: 0,
      totalFeesEstimated: 0,
      totalNetAmount: 0,
      priorityPaymentsCount: dto.payments?.filter(p => p.priority === "urgent").length || 0,
      status: SettlementStatus.OPTIMIZED,
      createdBy: userId,
    }));

    return await this.batchRepo.save(batch);
  }

  // RECON-SET-002: Listar settlement batches
  async getBatches(filters?: { currencyCode?: string; status?: SettlementStatus }): Promise<ReconSettlementBatch[]> {
    const where: Record<string, unknown> = {};
    if (filters?.currencyCode) where.currencyCode = filters.currencyCode;
    if (filters?.status) where.status = filters.status;

    return await this.batchRepo.find({ where });
  }

  // RECON-SET-003: Obtener batch por ID
  async getBatch(batchId: string): Promise<ReconSettlementBatch> {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) {
      throw new NotFoundException(`Settlement batch ${batchId} not found`);
    }
    return batch;
  }

  // RECON-SET-004: Enviar batch al banco
  async sendBatch(batchId: string): Promise<ReconSettlementBatch> {
    const batch = await this.getBatch(batchId);
    batch.status = SettlementStatus.SENT;
    batch.sentAt = new Date();
    return await this.batchRepo.save(batch);
  }

  // RECON-SET-005: Confirmar acknowledgment del banco
  async acknowledgeBatch(batchId: string, bankReference: string): Promise<ReconSettlementBatch> {
    const batch = await this.getBatch(batchId);
    batch.status = SettlementStatus.ACKNOWLEDGED;
    batch.acknowledgedAt = new Date();
    batch.bankReference = bankReference;
    return await this.batchRepo.save(batch);
  }

  // RECON-SET-006: Confirmar settlement liquidado
  async settleBatch(batchId: string): Promise<ReconSettlementBatch> {
    const batch = await this.getBatch(batchId);
    batch.status = SettlementStatus.SETTLED;
    batch.settledAt = new Date();
    return await this.batchRepo.save(batch);
  }

  // RECON-SET-007: Marcar batch como fallido
  async failBatch(batchId: string, reason: string): Promise<ReconSettlementBatch> {
    const batch = await this.getBatch(batchId);
    batch.status = SettlementStatus.FAILED;
    this.logger.error(`Settlement batch ${batchId} failed: ${reason}`);
    return await this.batchRepo.save(batch);
  }

  // RECON-SET-008: Análisis de fees por canal
  async getFeeAnalysis(channel?: string): Promise<{ channel: string; totalFees: number; batchCount: number }> {
    const qb = this.batchRepo.createQueryBuilder('b');
    if (channel) {
      qb.where('b.bankChannel = :channel', { channel });
    }
    const batches = await qb.getMany();

    const totalFees = batches.reduce((sum, b) => sum + (b.totalFeesEstimated || 0), 0);
    return {
      channel: channel || 'all',
      totalFees,
      batchCount: batches.length,
    };
  }

  // RECON-SET-009: Reporte de ahorros por optimización
  async getSavingsReport(batchId: string): Promise<{ grossCost: number; optimizedCost: number; savings: number; savingsPct: number }> {
    const batch = await this.getBatch(batchId);
    const optimizedCost = batch.totalFeesEstimated || 0;
    const grossCost = optimizedCost + (batch.optimizationSavings || 0);
    const savings = batch.optimizationSavings || 0;
    const savingsPct = grossCost > 0 ? (savings / grossCost) * 100 : 0;

    return { grossCost, optimizedCost, savings, savingsPct };
  }
}
