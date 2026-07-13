import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReconMatchingBatch } from '../entities/recon-matching-batch.entity';
import { ReconMatchingResult } from '../entities/recon-match-result.entity';
import { BatchStatus } from '../entities/batch-status.enum';
import { MatchType } from '../entities/match-type.enum';
import { MatchStatus } from '../entities/match-status.enum';
import { RunMatchingDto } from '../dto/run-matching.dto';
import { ManualMatchDto } from '../dto/manual-match.dto';
import { BulkReconcileDto } from '../dto/bulk-reconcile.dto';

@Injectable()
export class MatchingEngineService {
  private readonly logger = new Logger(MatchingEngineService.name);

  constructor(
    @InjectRepository(ReconMatchingBatch)
    private batchRepo: Repository<ReconMatchingBatch>,
    @InjectRepository(ReconMatchingResult)
    private resultRepo: Repository<ReconMatchingResult>,
  ) {}

  async runBatch(dto: RunMatchingDto, userId: string): Promise<ReconMatchingBatch> {
    const batch = this.batchRepo.create(Object.assign(new ReconMatchingBatch(), {
      status: BatchStatus.RUNNING,
      initiatedBy: userId,
      startedAt: new Date(),
    }));

    await this.batchRepo.save(batch);

    try {
      const results = await this.executeMatchingLogic(batch);
      
      batch.status = results.matchedCount > 0 ? BatchStatus.COMPLETED : BatchStatus.PENDING;
      batch.matchedCount = results.matchedCount;
      batch.unmatchedCountA = results.unmatchedCount;
      batch.unmatchedCountB = results.unmatchedCount;
      batch.completedAt = new Date();
      
      await this.batchRepo.save(batch);
      
      this.logger.log(`Batch ${batch.id} completed: ${results.matchedCount} matched, ${results.unmatchedCount} unmatched`);
      
      return batch;
    } catch (error) {
      batch.status = BatchStatus.FAILED;
      await this.batchRepo.save(batch);
      throw error;
    }
  }

  async getStatus(batchId: string): Promise<ReconMatchingBatch> {
    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
      relations: { results: true },
    });
    
    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }
    
    return batch;
  }

  async getMatchedResults(batchId: string): Promise<ReconMatchingResult[]> {
    return await this.resultRepo.find({
      where: { batchId, status: MatchStatus.MATCHED },
      relations: { batch: true },
    });
  }

  async getUnmatchedResults(batchId: string): Promise<ReconMatchingResult[]> {
    return await this.resultRepo.find({
      where: { batchId, status: MatchStatus.UNMATCHED },
      relations: { batch: true },
    });
  }

  async manualMatch(dto: ManualMatchDto, userId: string): Promise<ReconMatchingResult> {
    // Usamos el primer elemento de los arrays si existen
    const sourceARef = Array.isArray(dto.sourceARefs) ? dto.sourceARefs[0] : '';
    const sourceBRef = Array.isArray(dto.sourceBRefs) ? dto.sourceBRefs[0] : '';
    
    const result = this.resultRepo.create(Object.assign(new ReconMatchingResult(), {
      batchId: dto.batchId,
      matchType: MatchType.ONE_TO_ONE, // Usamos AUTO como valor por defecto válido
      sourceARefs: dto.sourceARefs,
      sourceBRefs: dto.sourceBRefs,
      amountA: 0,
      amountB: 0,
      status: MatchStatus.MATCHED,
      matchedManually: true,
      matchedBy: userId,
      matchReasonCode: dto.reasonCode || 'MANUAL_OVERRIDE',
    }));

    return await this.resultRepo.save(result);
  }

  async manualUnmatch(resultId: string, _userId: string): Promise<ReconMatchingResult> {
    const result = await this.resultRepo.findOne({ where: { id: resultId } });
    
    if (!result) {
      throw new NotFoundException(`Match result ${resultId} not found`);
    }

    result.status = MatchStatus.UNMATCHED;
    result.unmatchedReason = 'Manual unmatch by user';
    await this.resultRepo.save(result);
    
    return result;
  }

  async bulkReconcile(dto: BulkReconcileDto, userId: string): Promise<{ processed: number; success: number }> {
    let successCount = 0;

    for (const pair of dto.pairs) {
      try {
        await this.manualMatch(
          {
            batchId: dto.batchId,
            sourceARefs: [pair.sourceARef],
            sourceBRefs: [pair.sourceBRef],
            reasonCode: pair.reason,
          } as ManualMatchDto,
          userId || dto.performedBy!,
        );
        successCount++;
      } catch (error) {
        this.logger.warn(`Failed to match pair ${pair.sourceARef}/${pair.sourceBRef}: ${error.message}`);
      }
    }

    return { processed: dto.pairs.length, success: successCount };
  }

  async aiAutoSuggest(_batchId: string): Promise<ReconMatchingResult[]> {
    this.logger.warn('AI auto-suggest feature is a stub - not yet implemented');
    return [];
  }

  async aiLearning(_results: ReconMatchingResult[]): Promise<void> {
    this.logger.warn('AI learning feature is a stub - not yet implemented');
  }

  private async executeMatchingLogic(_batch: ReconMatchingBatch): Promise<{ matchedCount: number; unmatchedCount: number }> {
    return { matchedCount: 0, unmatchedCount: 0 };
  }
}
