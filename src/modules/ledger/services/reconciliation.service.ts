import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { LedgerReconciliation } from '../entities/ledger_reconciliation.entity';
import { ReconciliationStatus } from '../entities/reconciliation-status.enum';
import { ReconcileAutoDto } from '../dto/reconcile-auto.dto';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @InjectRepository(LedgerReconciliation)
    private reconcileRepo: Repository<LedgerReconciliation>,
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
    const difference = dto.statement_balance - (dto.tolerance ?? 0);

    const rec = this.reconcileRepo.create({
      bank_account_id: dto.bank_account_id,
      period_id: dto.period_id,
      statement_date: new Date(dto.statement_date),
      statement_balance: dto.statement_balance,
      book_balance: difference,
      difference: 0,
      status: ReconciliationStatus.AUTO_MATCHED,
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

  async autoMatch(dto: ReconcileAutoDto): Promise<{ matched: number; unmatched: number }> {
    const tolerance = dto.tolerance || 0;
    const diff = Math.abs(dto.statement_balance - tolerance);

    let matched = 0;
    if (diff <= 0.01) {
      matched = 99; // Mock value — wire to actual journal lines
    }

    return { matched, unmatched: 0 };
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

    // Placeholder: en producción, consultaría journal lines no matcheados
    // y generaría análisis de diferencias por tipo
    const discrepancies = [
      {
        type: 'timing_difference',
        amount: Math.abs(recon.difference),
        description: 'Diferencia de timing - transacciones en tránsito',
        justification: recon.difference === 0 ? 'Sin diferencia' : null,
        resolved: recon.difference === 0,
      },
    ];

    const totalUnresolved = discrepancies
      .filter((d) => !d.resolved)
      .reduce((sum, d) => sum + d.amount, 0);

    return {
      reconciliationId,
      statementBalance: recon.statement_balance,
      bookBalance: recon.book_balance,
      difference: recon.difference,
      discrepancies,
      totalUnresolved,
    };
  }

}