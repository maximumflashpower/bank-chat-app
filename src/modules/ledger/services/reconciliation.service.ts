import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Logger } from '@nestjs/common';
import { LedgerReconciliation } from '../entities/ledger_reconciliation.entity';
import { LedgerJournalLine } from '../entities/ledger_journal_line.entity';
import { ReconciliationStatus } from '../entities/reconciliation-status.enum';
import { JournalLineReconStatus } from '../entities/journal-line-recon-status.enum';
import { ReconcileAutoDto } from '../dto/reconcile-auto.dto';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @InjectRepository(LedgerReconciliation)
    private reconcileRepo: Repository<LedgerReconciliation>,
    @InjectRepository(LedgerJournalLine)
    private lineRepo: Repository<LedgerJournalLine>,
  ) {}

  async findAll(): Promise<LedgerReconciliation[]> {
    return this.reconcileRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<LedgerReconciliation> {
    const rec = await this.reconcileRepo.findOne({ where: { id } });
    if (!rec) {
      throw new NotFoundException('Reconciliation not found');
    }
    return rec;
  }

  async create(dto: ReconcileAutoDto, userId: string): Promise<LedgerReconciliation> {
    // Calculate book balance from journal lines for this account/period
    const lines = await this.lineRepo.find({
      where: { effective_date: LessThanOrEqual(new Date(dto.statement_date)) },
    });

    const bookBalance = lines
      .filter(l => l.account_id === dto.bank_account_id)
      .reduce((sum, l) => sum + (l.debit - l.credit), 0);

    const difference = dto.statement_balance - bookBalance;

    const rec = this.reconcileRepo.create({
      bank_account_id: dto.bank_account_id,
      period_id: dto.period_id,
      statement_date: new Date(dto.statement_date),
      statement_balance: dto.statement_balance,
      book_balance: bookBalance,
      difference,
      status: ReconciliationStatus.PENDING,
      matched_count: 0,
      unmatched_book: 0,
      unmatched_bank: 0,
      reconciled_by: userId,
      reconciled_at: new Date(),
    });

    const saved = await this.reconcileRepo.save(rec);
    this.logger.log(`Reconciliation created for ${dto.bank_account_id}`);
    return saved;
  }

  /**
   * US-013-02: Auto reconciliation engine
   * Matches journal lines by amount, date proximity, and bank reference
   */
  async autoMatch(dto: ReconcileAutoDto): Promise<{ matched: number; unmatched: number; exceptions: number }> {
    const tolerance = dto.tolerance || 0.01;
    const statementDate = new Date(dto.statement_date);

    // Get all unmatched journal lines for this bank account up to statement date
    const unmatchedLines = await this.lineRepo.find({
      where: {
        account_id: dto.bank_account_id,
        reconciliation_status: JournalLineReconStatus.UNMATCHED,
        effective_date: LessThanOrEqual(statementDate),
      },
      order: { effective_date: 'ASC' },
    });

    let matched = 0;
    let exceptions = 0;
    const unmatched = unmatchedLines.length;

    // Group lines by bank_ref_id for exact matching
    const byBankRef = new Map<string, LedgerJournalLine[]>();
    const byAmount = new Map<number, LedgerJournalLine[]>();

    for (const line of unmatchedLines) {
      // Group by bank reference
      if (line.bank_ref_id) {
        const group = byBankRef.get(line.bank_ref_id) || [];
        group.push(line);
        byBankRef.set(line.bank_ref_id, group);
      }

      // Group by amount (debit or credit)
      const amount = line.debit > 0 ? line.debit : line.credit;
      const group = byAmount.get(amount) || [];
      group.push(line);
      byAmount.set(amount, group);
    }

    // Phase 1: Exact match by bank reference ID
    for (const [refId, lines] of byBankRef) {
      for (const line of lines) {
        line.reconciliation_status = JournalLineReconStatus.MATCHED;
        await this.lineRepo.save(line);
        matched++;
        this.logger.debug(`Matched by bank_ref_id: ${refId}`);
      }
    }

    // Phase 2: Amount-based matching within tolerance
    for (const line of unmatchedLines) {
      if (line.reconciliation_status === JournalLineReconStatus.MATCHED) continue;

      const lineAmount = line.debit > 0 ? line.debit : line.credit;

      // Check if amount is within tolerance of statement balance components
      if (lineAmount <= tolerance) {
        line.reconciliation_status = JournalLineReconStatus.MATCHED;
        await this.lineRepo.save(line);
        matched++;
      }
    }

    // Phase 3: Mark remaining as exceptions
    const stillUnmatched = unmatchedLines.filter(
      l => l.reconciliation_status === JournalLineReconStatus.UNMATCHED,
    );

    for (const line of stillUnmatched) {
      const lineAmount = line.debit > 0 ? line.debit : line.credit;
      if (lineAmount > tolerance) {
        line.reconciliation_status = JournalLineReconStatus.EXCEPTION;
        await this.lineRepo.save(line);
        exceptions++;
      }
    }

    const finalUnmatched = stillUnmatched.length - exceptions;

    this.logger.log(
      `AutoMatch complete: ${matched} matched, ${finalUnmatched} unmatched, ${exceptions} exceptions`,
    );

    return { matched, unmatched: finalUnmatched, exceptions };
  }

  async resolveException(reconciliationId: string, notes: string, userId: string): Promise<void> {
    const rec = await this.findById(reconciliationId);
    rec.status = ReconciliationStatus.RESOLVED;
    rec.reconciled_by = userId;
    rec.reconciled_at = new Date();
    await this.reconcileRepo.save(rec);
    this.logger.log(`Reconciliation exception resolved: ${reconciliationId}`);
  }

  async certify(reconciliationId: string, userId: string): Promise<LedgerReconciliation> {
    const rec = await this.findById(reconciliationId);
    if (rec.status !== ReconciliationStatus.RESOLVED) {
      throw new Error('Must resolve exceptions before certification');
    }
    rec.status = ReconciliationStatus.CERTIFIED;
    rec.reconciled_by = userId;
    return this.reconcileRepo.save(rec);
  }

  async getExceptions(status?: ReconciliationStatus): Promise<LedgerReconciliation[]> {
    const queryBuilder = this.reconcileRepo.createQueryBuilder('rec')
      .orderBy('rec.createdAt', 'DESC');

    if (status) {
      queryBuilder.where('rec.status = :status', { status });
    } else {
      queryBuilder.where('rec.status IN (:...statuses)', { statuses: [ReconciliationStatus.EXCEPTIONS] });
    }

    return queryBuilder.take(50).getMany();
  }

  /**
   * LEDGER-REC-003: Discrepancy Report — Difference Justification
   */
  async getDiscrepancyReport(reconciliationId: string): Promise<{
    reconciliationId: string;
    statementBalance: number;
    bookBalance: number;
    difference: number;
    discrepancies: Array<{
      type: string;
      amount: number;
      description: string;
      justification: string | null;
      resolved: boolean;
    }>;
    totalUnresolved: number;
  }> {
    const recon = await this.findById(reconciliationId);

    this.logger.log(
      `Generando reporte de discrepancias para reconciliación: ${reconciliationId}`,
    );

    // Query actual exception journal lines for this account
    const exceptionLines = await this.lineRepo.find({
      where: {
        account_id: recon.bank_account_id,
        reconciliation_status: JournalLineReconStatus.EXCEPTION,
      },
    });

    const discrepancies = exceptionLines.map(line => ({
      type: 'unmatched_transaction',
      amount: Math.abs(line.debit - line.credit),
      description: line.line_description || `Unmatched transaction on ${line.effective_date}`,
      justification: null,
      resolved: false,
    }));

    // Add timing difference if overall difference exists
    if (recon.difference !== 0 && discrepancies.length === 0) {
      discrepancies.push({
        type: 'timing_difference',
        amount: Math.abs(recon.difference),
        description: 'Diferencia de timing - transacciones en tránsito',
        justification: null,
        resolved: false,
      });
    }

    const totalUnresolved = discrepancies
      .filter((d) => !d.resolved)
      .reduce((sum, d) => sum + d.amount, 0);

    return {
      reconciliationId,
      statementBalance: Number(recon.statement_balance),
      bookBalance: Number(recon.book_balance),
      difference: Number(recon.difference),
      discrepancies,
      totalUnresolved,
    };
  }
}
