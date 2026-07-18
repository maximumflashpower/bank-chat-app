import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConsolidationEliminationEntry,
  EliminationType,
  EliminationStatus,
} from '../entities/consolidation-elimination-entry.entity';

@Injectable()
export class EliminationEngineService {
  private readonly logger = new Logger(EliminationEngineService.name);

  constructor(
    @InjectRepository(ConsolidationEliminationEntry)
    private readonly repo: Repository<ConsolidationEliminationEntry>,
  ) {}

  async createEntry(data: Partial<ConsolidationEliminationEntry>): Promise<ConsolidationEliminationEntry> {
    const code = data.eliminationCode || `ELIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const entry = this.repo.create({
      ...data,
      eliminationCode: code,
      status: EliminationStatus.PENDING,
      eliminatedAmount: 0,
      remainingAmount: data.originalAmount || 0,
    });
    const saved = await this.repo.save(entry);
    this.logger.log(`Elimination entry created: ${code}`);
    return saved;
  }

  async findById(id: string): Promise<ConsolidationEliminationEntry> {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException(`Elimination entry ${id} not found`);
    return entry;
  }

  async findByRun(runId: string): Promise<ConsolidationEliminationEntry[]> {
    return this.repo.find({ where: { runId }, order: { createdAt: 'ASC' } });
  }

  async autoMatch(runId: string): Promise<{
    matched: number;
    partial: number;
    unmatched: number;
    totalAmount: number;
  }> {
    const entries = await this.findByRun(runId);
    const pending = entries.filter(e => e.status === EliminationStatus.PENDING);
    const matchedPairs: Map<string, ConsolidationEliminationEntry[]> = new Map();

    // Group by from/to entity pair and elimination type
    for (const entry of pending) {
      const reverseKey = `${entry.toEntityId}_${entry.fromEntityId}_${entry.eliminationType}`;
      const forwardKey = `${entry.fromEntityId}_${entry.toEntityId}_${entry.eliminationType}`;
      const key = `${forwardKey}_${entry.originalAmount}`;

      // Look for matching reverse entry
      const matchKey = `${reverseKey}_${entry.originalAmount}`;
      if (matchedPairs.has(matchKey)) {
        const pair = matchedPairs.get(matchKey)!;
        pair.push(entry);
      } else {
        const existing = matchedPairs.get(key) || [];
        existing.push(entry);
        matchedPairs.set(key, existing);
      }
    }

    let matched = 0;
    let partial = 0;
    let unmatched = 0;
    let totalAmount = 0;

    for (const [, group] of matchedPairs) {
      if (group.length >= 2) {
        // Full match
        for (const entry of group) {
          entry.status = EliminationStatus.MATCHED;
          entry.autoMatched = true;
          entry.matchConfidence = 100;
          entry.eliminatedAmount = entry.originalAmount;
          entry.remainingAmount = 0;
          matched++;
          totalAmount += Number(entry.originalAmount);
        }
      } else if (group.length === 1) {
        // Try partial match by amount proximity
        const entry = group[0];
        const potentialMatches = pending.filter(
          e =>
            e.id !== entry.id &&
            e.toEntityId === entry.fromEntityId &&
            e.fromEntityId === entry.toEntityId &&
            e.eliminationType === entry.eliminationType,
        );

        if (potentialMatches.length > 0) {
          const closest = potentialMatches.reduce((prev, curr) =>
            Math.abs(Number(curr.originalAmount) - Number(entry.originalAmount)) <
            Math.abs(Number(prev.originalAmount) - Number(entry.originalAmount))
              ? curr
              : prev,
          );
          const diff = Math.abs(Number(closest.originalAmount) - Number(entry.originalAmount));
          const confidence = Math.max(0, 100 - (diff / Number(entry.originalAmount)) * 100);

          entry.status = EliminationStatus.PARTIAL;
          entry.autoMatched = true;
          entry.matchConfidence = Math.round(confidence * 100) / 100;
          entry.matchedEntryId = closest.id;
          entry.eliminatedAmount = Math.min(Number(entry.originalAmount), Number(closest.originalAmount));
          entry.remainingAmount = Number(entry.originalAmount) - Number(entry.eliminatedAmount);
          partial++;
          totalAmount += Number(entry.eliminatedAmount);
        } else {
          unmatched++;
        }
      }
    }

    await this.repo.save(pending);
    this.logger.log(
      `Auto-match run ${runId}: matched=${matched}, partial=${partial}, unmatched=${unmatched}`,
    );

    return { matched, partial, unmatched, totalAmount };
  }

  async manualMatch(
    entryId: string,
    matchedEntryId: string,
    eliminatedAmount: number,
  ): Promise<ConsolidationEliminationEntry> {
    const entry = await this.findById(entryId);
    const matched = await this.findById(matchedEntryId);

    entry.status = EliminationStatus.MANUAL_OVERRIDE;
    entry.matchedEntryId = matchedEntryId;
    entry.eliminatedAmount = eliminatedAmount;
    entry.remainingAmount = Number(entry.originalAmount) - eliminatedAmount;
    entry.autoMatched = false;
    entry.matchConfidence = 100;

    this.logger.log(`Manual match: ${entry.eliminationCode} → ${matched.eliminationCode}`);
    return this.repo.save(entry);
  }

  async executeElimination(entryId: string): Promise<ConsolidationEliminationEntry> {
    const entry = await this.findById(entryId);
    if (entry.status !== EliminationStatus.MATCHED &&
        entry.status !== EliminationStatus.MANUAL_OVERRIDE &&
        entry.status !== EliminationStatus.PARTIAL) {
      throw new BadRequestException(`Entry ${entryId} must be matched before elimination`);
    }
    entry.status = EliminationStatus.ELIMINATED;
    this.logger.log(`Elimination executed: ${entry.eliminationCode}`);
    return this.repo.save(entry);
  }

  async executeBatchElimination(runId: string): Promise<{ eliminated: number; skipped: number }> {
    const entries = await this.findByRun(runId);
    const eligible = entries.filter(
      e => e.status === EliminationStatus.MATCHED || e.status === EliminationStatus.MANUAL_OVERRIDE,
    );
    const skipped = entries.length - eligible.length;

    for (const entry of eligible) {
      entry.status = EliminationStatus.ELIMINATED;
    }
    await this.repo.save(eligible);
    this.logger.log(`Batch elimination run ${runId}: ${eligible.length} eliminated, ${skipped} skipped`);
    return { eliminated: eligible.length, skipped };
  }

  async getEliminationSummary(runId: string): Promise<{
    total: number;
    pending: number;
    matched: number;
    partial: number;
    eliminated: number;
    totalAmount: number;
    eliminatedAmount: number;
  }> {
    const entries = await this.findByRun(runId);
    return {
      total: entries.length,
      pending: entries.filter(e => e.status === EliminationStatus.PENDING).length,
      matched: entries.filter(e => e.status === EliminationStatus.MATCHED).length,
      partial: entries.filter(e => e.status === EliminationStatus.PARTIAL).length,
      eliminated: entries.filter(e => e.status === EliminationStatus.ELIMINATED).length,
      totalAmount: entries.reduce((s, e) => s + Number(e.originalAmount), 0),
      eliminatedAmount: entries.reduce((s, e) => s + Number(e.eliminatedAmount), 0),
    };
  }
}
