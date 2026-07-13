import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReconNettingBatch } from '../entities/recon-netting-batch.entity';
import { NettingStatus } from '../entities/netting-status.enum';
import { CalculateNettingDto } from '../dto/calculate-netting.dto';

@Injectable()
export class NettingService {
  private readonly logger = new Logger(NettingService.name);

  constructor(
    @InjectRepository(ReconNettingBatch)
    private nettingRepo: Repository<ReconNettingBatch>,
  ) {}

  // RECON-NET-001: Calcular netting
  async calculate(dto: CalculateNettingDto, userId: string): Promise<ReconNettingBatch> {
    const batchNumber = `NET-${Date.now()}`;
    
    const batch = this.nettingRepo.create(Object.assign(new ReconNettingBatch(), {
      nettingBatchNumber: batchNumber,
      nettingType: dto.nettingType,
      periodDate: new Date(dto.periodDate),
      status: NettingStatus.CALCULATED,
      executedBy: userId,
    }));

    // Placeholder: cálculo real de netting
    batch.participantsCount = 0;
    batch.grossObligationsCount = 0;
    batch.netSettlementsCount = 0;
    batch.grossVolumeTotal = 0;
    batch.netVolumeTotal = 0;
    batch.reductionPercentage = 0;

    return await this.nettingRepo.save(batch);
  }

  // RECON-NET-002: Ejecutar netting
  async execute(batchId: string, userId: string): Promise<ReconNettingBatch> {
    const batch = await this.nettingRepo.findOne({ where: { id: batchId } });
    
    if (!batch) {
      throw new NotFoundException(`Netting batch ${batchId} not found`);
    }

    batch.status = NettingStatus.EXECUTED;
    batch.executedBy = userId;
    batch.executedAt = new Date();

    return await this.nettingRepo.save(batch);
  }

  // RECON-NET-003: Obtener resultado
  async getResult(batchId: string): Promise<ReconNettingBatch> {
    const batch = await this.nettingRepo.findOne({ where: { id: batchId } });
    
    if (!batch) {
      throw new NotFoundException(`Netting batch ${batchId} not found`);
    }
    
    return batch;
  }

  // RECON-NET-004: Postear al ledger
  async postToLedger(batchId: string): Promise<ReconNettingBatch> {
    const batch = await this.nettingRepo.findOne({ where: { id: batchId } });
    
    if (!batch) {
      throw new NotFoundException(`Netting batch ${batchId} not found`);
    }

    batch.postedToLedger = true;
    batch.status = NettingStatus.POSTED;
    // journalEntryId sería asignado por el Ledger module en implementación real
    
    return await this.nettingRepo.save(batch);
  }

  // RECON-NET-005: Cancelar netting
  async cancel(batchId: string): Promise<ReconNettingBatch> {
    const batch = await this.nettingRepo.findOne({ where: { id: batchId } });
    
    if (!batch) {
      throw new NotFoundException(`Netting batch ${batchId} not found`);
    }

    if (batch.postedToLedger) {
      throw new Error('Cannot cancel a netting batch already posted to ledger');
    }

    batch.status = NettingStatus.CANCELLED;

    return await this.nettingRepo.save(batch);
  }
}
