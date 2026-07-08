import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryJournalLink } from '../entities/inventory-journal-link.entity';
import { LedgerJournalEntry } from '../entities/ledger_journal_entry.entity';
import { LedgerJournalLine } from '../entities/ledger_journal_line.entity';
import { InventoryJournalReportDto } from '../dto/inventory-journal-report.dto';

export interface InventoryFinancialReport {
  totalPostedValue: number;
  totalTransactions: number;
  byMovementType: { type: string; count: number; value: number }[];
  byPeriod: { period: string; value: number }[];
}

@Injectable()
export class InventoryFinancialReportingService {
  constructor(
    @InjectRepository(InventoryJournalLink)
    private linkRepo: Repository<InventoryJournalLink>,
    @InjectRepository(LedgerJournalEntry)
    private jeRepo: Repository<LedgerJournalEntry>,
    @InjectRepository(LedgerJournalLine)
    private lineRepo: Repository<LedgerJournalLine>,
  ) {}

  async generateFinancialReport(dto: InventoryJournalReportDto): Promise<InventoryFinancialReport> {
    const links = await this.linkRepo.find({
      relations: { journalEntry: true },
    });

    const filteredLinks = links.filter((link: any) => {
      if (dto.companyProfileId && link.companyProfileId !== dto.companyProfileId) return false;
      if (dto.startDate && new Date(link.journalEntry.createdAt) < new Date(dto.startDate)) return false;
      if (dto.endDate && new Date(link.journalEntry.createdAt) > new Date(dto.endDate)) return false;
      return true;
    });

    let totalPostedValue = 0;
    const typeCounts = new Map<string, { count: number; value: number }>();
    const periodTotals = new Map<string, number>();

    for (const link of filteredLinks) {
      const entry = link.journalEntry;
      totalPostedValue += Number(entry.total_debit);

      // Group by movement type from description
      const movementType = 'UNKNOWN'; // Should extract from description
      const existing = typeCounts.get(movementType) || { count: 0, value: 0 };
      typeCounts.set(movementType, { count: existing.count + 1, value: existing.value + Number(entry.total_debit) });

      const period = entry.createdAt.toISOString().slice(0, 7);
      periodTotals.set(period, (periodTotals.get(period) || 0) + Number(entry.total_debit));
    }

    return {
      totalPostedValue,
      totalTransactions: filteredLinks.length,
      byMovementType: Array.from(typeCounts.entries()).map(([type, data]) => ({ type, ...data })),
      byPeriod: Array.from(periodTotals.entries()).map(([period, value]) => ({ period, value })),
    };
  }

  async getInventoryAssetBalance(companyProfileId: string): Promise<number> {
    // Should sum all debit balances on inventory asset accounts
    return 0;
  }

  async getCOGSTotal(startDate: string, endDate: string): Promise<number> {
    // Should query COGS account credits in the period
    return 0;
  }
}
