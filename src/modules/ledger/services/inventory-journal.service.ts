import { GenerateInventoryJournalDto } from "../dto/generate-inventory-journal.dto";
import { InventoryJournalReportDto } from "../dto/inventory-journal-report.dto";
import { FiscalPeriodStatus } from "../entities/fiscal-period-status.enum";
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryAccountMapping } from '../entities/inventory-account-mapping.entity';
import { InventoryJournalLink } from '../entities/inventory-journal-link.entity';
import { InventoryPostingRule } from '../entities/inventory-posting-rule.entity';
import { LedgerJournalEntry } from '../entities/ledger_journal_entry.entity';
import { LedgerJournalLine } from '../entities/ledger_journal_line.entity';
import { JournalSourceType } from '../entities/journal-source-type.enum';
import { JournalEntryStatus } from '../entities/journal-entry-status.enum';
import { LedgerFiscalPeriod } from '../entities/ledger_fiscal_period.entity';
import { JournalLineDto } from '../dto/create-journal-entry.dto';

export interface InventoryJournalEntry {
  journalEntry: LedgerJournalEntry;
  link: InventoryJournalLink;
}

@Injectable()
export class InventoryJournalService {
  constructor(
    @InjectRepository(InventoryAccountMapping)
    private mappingRepo: Repository<InventoryAccountMapping>,
    @InjectRepository(InventoryJournalLink)
    private linkRepo: Repository<InventoryJournalLink>,
    @InjectRepository(InventoryPostingRule)
    private ruleRepo: Repository<InventoryPostingRule>,
    @InjectRepository(LedgerJournalEntry)
    private jeRepo: Repository<LedgerJournalEntry>,
    @InjectRepository(LedgerJournalLine)
    private lineRepo: Repository<LedgerJournalLine>,
    @InjectRepository(LedgerFiscalPeriod)
    private periodRepo: Repository<LedgerFiscalPeriod>,
  ) {}

  async createAccountMapping(dto: any): Promise<InventoryAccountMapping> {
    const mapping = this.mappingRepo.create({
      companyProfileId: dto.companyId,
      category: dto.category,
      movementType: dto.movementType,
      accountId: dto.accountId,
    });
    return this.mappingRepo.save(mapping);
  }

  async findByCompanyAndMovement(companyProfileId: string, movementType: string): Promise<InventoryAccountMapping[]> {
    return this.mappingRepo.find({
      where: { companyProfileId, movementType },
      relations: { account: true },
    });
  }

  async createPostingRule(dto: any): Promise<InventoryPostingRule> {
    const rule = this.ruleRepo.create({
      companyProfileId: dto.companyProfileId,
      movementType: dto.movementType,
      debitAccountType: dto.debitAccountType,
      debitAccountId: dto.debitAccountId,
      creditAccountType: dto.creditAccountType,
      creditAccountId: dto.creditAccountId,
    });
    return this.ruleRepo.save(rule);
  }

  async findRulesByCompany(companyProfileId: string): Promise<InventoryPostingRule[]> {
    return this.ruleRepo.find({
      where: { companyProfileId, isActive: true },
    });
  }

  async generateJournalFromMovement(dto: GenerateInventoryJournalDto): Promise<InventoryJournalEntry> {
    const rule = await this.ruleRepo.findOne({
      where: { 
        companyProfileId: dto.companyProfileId,
        movementType: dto.movementType,
        isActive: true,
      },
    });

    if (!rule) {
      throw new BadRequestException(`No posting rule found for movement type ${dto.movementType}`);
    }

    const period = await this.periodRepo.findOne({
      where: { id: dto.fiscalPeriodId },
    });
    if (!period || period.status !== FiscalPeriodStatus.OPEN) {
      throw new BadRequestException('Invalid fiscal period');
    }

    const entryNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-5)}`;

    const lines: JournalLineDto[] = [
      {
        account_id: rule.debitAccountId,
        debit: dto.totalCost || (dto.unitCost ?? 0) * dto.quantity,
        credit: 0,
        currency: dto.currency || 'USD',
        effective_date: new Date().toISOString(),
        line_description: `${dto.movementType.toUpperCase()} - ${dto.reference || ''}`,
      },
      {
        account_id: rule.creditAccountId,
        debit: 0,
        credit: dto.totalCost || (dto.unitCost ?? 0) * dto.quantity,
        currency: dto.currency || 'USD',
        effective_date: new Date().toISOString(),
        line_description: `${dto.movementType.toUpperCase()} - ${dto.reference || ''}`,
      },
    ];

    const entry = this.jeRepo.create({
      entry_number: entryNumber,
      reference: dto.reference,
      description: `Inventory ${dto.movementType.toUpperCase()}: ${dto.itemId}`,
      fiscal_period_id: dto.fiscalPeriodId,
      currency: dto.currency || 'USD',
      total_debit: dto.totalCost || (dto.unitCost ?? 0) * dto.quantity,
      total_credit: dto.totalCost || (dto.unitCost ?? 0) * dto.quantity,
      is_balanced: true,
      status: JournalEntryStatus.POSTED,
      source_type: JournalSourceType.INVENTORY,
      source_entity: 'smb-inventory',
      created_by: dto.createdBy || '900d3800-e35b-4dd2-95e1-b6eef6a2378c',
      posted_at: new Date(),
    });

    const savedEntry = await this.jeRepo.save(entry);

    for (const line of lines) {
      const jl = this.lineRepo.create({
        journal_entry_id: savedEntry.id,
        account_id: line.account_id,
        debit: line.debit,
        credit: line.credit,
        currency: line.currency,
        effective_date: new Date(line.effective_date),
        line_description: line.line_description,
      });
      await this.lineRepo.save(jl);
    }

    const link = this.linkRepo.create({
      journalEntryId: savedEntry.id,
      stockMovementId: dto.stockMovementId,
      companyProfileId: dto.companyProfileId,
      isReconciled: true,
    });
    const savedLink = await this.linkRepo.save(link);

    return { journalEntry: savedEntry, link: savedLink };
  }

  async reconcile(stockMovementId: string): Promise<InventoryJournalLink | null> {
    return this.linkRepo.findOne({
      where: { stockMovementId, isReconciled: true },
      relations: { journalEntry: true },
    });
  }

  async generateReport(dto: InventoryJournalReportDto): Promise<any[]> {
    const qb = this.linkRepo.createQueryBuilder('ijl')
      .leftJoin(LedgerJournalEntry, 'je', 'ijl.journalEntryId = je.id')
      .where('ijl.isReconciled = :reconciled', { reconciled: true });

    if (dto.startDate) qb.andWhere('je.createdAt >= :start', { start: dto.startDate });
    if (dto.endDate) qb.andWhere('je.createdAt <= :end', { end: dto.endDate });
    if (dto.companyProfileId) qb.andWhere('ijl.companyProfileId = :cpid', { cpid: dto.companyProfileId });

    return qb.getMany();
  }

  async getUnreconciledMovements(companyProfileId: string): Promise<string[]> {
    const linkedMovements = await this.linkRepo.find({
      where: { companyProfileId, isReconciled: true },
    });
    // Placeholder: should query smb_stock_movement table for unmatched ones
    return [];
  }
}
