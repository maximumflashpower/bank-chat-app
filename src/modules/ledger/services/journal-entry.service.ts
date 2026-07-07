import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { LedgerJournalEntry } from '../entities/ledger_journal_entry.entity';
import { LedgerJournalLine } from '../entities/ledger_journal_line.entity';
import { JournalEntryStatus } from '../entities/journal-entry-status.enum';
import { JournalSourceType } from '../entities/journal-source-type.enum';
import { CreateJournalEntryDto, JournalLineDto } from '../dto/create-journal-entry.dto';
import { QueryJournalEntriesDto } from '../dto/query-journal-entries.dto';
import { LedgerFiscalPeriod } from '../entities/ledger_fiscal_period.entity';
import { FiscalPeriodStatus } from '../entities/fiscal-period-status.enum';

@Injectable()
export class JournalEntryService {
  private readonly logger = new Logger(JournalEntryService.name);

  constructor(
    @InjectRepository(LedgerJournalEntry)
    private jeRepo: Repository<LedgerJournalEntry>,
    @InjectRepository(LedgerJournalLine)
    private lineRepo: Repository<LedgerJournalLine>,
    @InjectRepository(LedgerFiscalPeriod)
    private periodRepo: Repository<LedgerFiscalPeriod>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateJournalEntryDto, userId: string): Promise<LedgerJournalEntry> {
    const totalDebit = dto.lines.reduce((sum, l) => sum + Number(l.debit), 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + Number(l.credit), 0);

    if (totalDebit !== totalCredit) {
      throw new BadRequestException(
        `Double-entry violation: debit (${totalDebit}) != credit (${totalCredit})`,
      );
    }

    const period = await this.periodRepo.findOne({ where: { id: dto.fiscal_period_id } });
    if (!period) {
      throw new NotFoundException('Fiscal period not found');
    }
    if (period.status === FiscalPeriodStatus.CLOSED || period.status === FiscalPeriodStatus.PERMANENT) {
      throw new BadRequestException(`Period ${period.period_name} is locked`);
    }

    const entryNumber = `JE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-5)}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entry = queryRunner.manager.create(LedgerJournalEntry, {
        entry_number: entryNumber,
        reference: dto.reference,
        description: dto.description,
        fiscal_period_id: dto.fiscal_period_id,
        currency: dto.currency,
        total_debit: totalDebit,
        total_credit: totalCredit,
        is_balanced: true,
        status: JournalEntryStatus.DRAFT,
        source_type: JournalSourceType.API,
        source_entity: dto.source_entity || 'journal-entry-service',
        created_by: userId,
      });

      const savedEntry = await queryRunner.manager.save(entry);

      for (const line of dto.lines) {
        const jl = queryRunner.manager.create(LedgerJournalLine, {
          journal_entry_id: savedEntry.id,
          account_id: line.account_id,
          segment_branch_id: line.segment_branch_id || null,
          segment_dept_id: line.segment_dept_id || null,
          segment_project_id: line.segment_project_id || null,
          debit: line.debit,
          credit: line.credit,
          currency: line.currency || dto.currency,
          effective_date: new Date(line.effective_date),
          line_description: line.line_description || null,
        });
        await queryRunner.manager.save(jl);
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Journal entry created: ${entryNumber} by ${userId}`);
      return savedEntry;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string): Promise<any> {
    const entry = await this.jeRepo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    const lines = await this.lineRepo.find({ where: { journal_entry_id: id } });
    return { ...entry, lines };
  }

  async query(dto: QueryJournalEntriesDto): Promise<[LedgerJournalEntry[], number]> {
    const qb = this.jeRepo.createQueryBuilder('je');

    if (dto.fiscal_period_id) {
      qb.andWhere('je.fiscal_period_id = :pid', { pid: dto.fiscal_period_id });
    }
    if (dto.status) {
      qb.andWhere('je.status = :status', { status: dto.status });
    }
    if (dto.reference) {
      qb.andWhere('je.reference ILIKE :ref', { ref: `%${dto.reference}%` });
    }
    if (dto.currency) {
      qb.andWhere('je.currency = :cur', { cur: dto.currency });
    }

    qb.orderBy('je.createdAt', 'DESC').take(100);
    return qb.getManyAndCount();
  }

  async post(id: string, userId: string): Promise<LedgerJournalEntry> {
    const entry = await this.jeRepo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    if (entry.status !== JournalEntryStatus.DRAFT) {
      throw new BadRequestException('Only draft entries can be posted');
    }

    entry.status = JournalEntryStatus.POSTED;
    entry.posted_at = new Date();
    return this.jeRepo.save(entry);
  }

  async reverse(id: string, userId: string): Promise<LedgerJournalEntry> {
    const original = await this.findById(id);
    if (original.status !== JournalEntryStatus.POSTED) {
      throw new BadRequestException('Only posted entries can be reversed');
    }

    const lines = await this.lineRepo.find({ where: { journal_entry_id: id } });
    const reversedLines: JournalLineDto[] = lines.map((l) => ({
      account_id: l.account_id,
      segment_branch_id: l.segment_branch_id || undefined,
      segment_dept_id: l.segment_dept_id || undefined,
      segment_project_id: l.segment_project_id || undefined,
      debit: l.credit,
      credit: l.debit,
      currency: l.currency,
      effective_date: new Date().toISOString(),
      line_description: `REVERSAL: ${l.line_description || ''}`,
    }));

    const reversalDto: CreateJournalEntryDto = {
      reference: `REVERSAL-${original.entry_number}`,
      description: `Reversal of ${original.entry_number}: ${original.description}`,
      fiscal_period_id: original.fiscal_period_id,
      currency: original.currency,
      lines: reversedLines,
      source_entity: 'journal-entry-reversal',
    };

    const reversal = await this.create(reversalDto, userId);
    await this.post(reversal.id, userId);

    original.status = JournalEntryStatus.REVERSED;
    original.reversed_by_id = reversal.id;
    await this.jeRepo.save(original);

    this.logger.log(`Journal entry ${original.entry_number} reversed by ${userId}`);
    return reversal;
  }
}
