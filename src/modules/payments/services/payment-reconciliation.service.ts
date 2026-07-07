import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayReconciliationEntry } from '../entities/pay-reconciliation-entry.entity';
import { ReconcileAutoDto } from '../dto/reconcile-auto.dto';
import { ManualMatchDto } from '../dto/manual-match.dto';

@Injectable()
export class PaymentReconciliationService {
  constructor(
    @InjectRepository(PayReconciliationEntry)
    private repo: Repository<PayReconciliationEntry>,
  ) {}

  async autoReconcile(dto: ReconcileAutoDto): Promise<{ matched: number; unmatched: number }> {
    const { fromDate, toDate, accountId } = dto;

    const pendingEntries = await this.getPendingStatements(fromDate, toDate, accountId);
    let matched = 0;
    let unmatched = 0;

    for (const entry of pendingEntries) {
      const match = await this.findPotentialMatch(entry);
      if (match) {
        await this.matchEntry(entry, match);
        matched++;
      } else {
        unmatched++;
      }
    }

    return { matched, unmatched };
  }

  private async getPendingStatements(from?: string, to?: string, accountId?: string): Promise<any[]> {
    return [];
  }

  private async findPotentialMatch(statementEntry: any): Promise<string | null> {
    const referenceMatch = this.extractReferenceFromStatement(statementEntry);
    if (referenceMatch) {
      return this.findInstructionByReference(referenceMatch);
    }
    return null;
  }

  private extractReferenceFromStatement(entry: any): string | null {
    return entry.reference || null;
  }

  private async findInstructionByReference(ref: string): Promise<string | null> {
    return null;
  }

  private async matchEntry(statementEntry: any, instructionId: string): Promise<void> {
    await this.repo.save({
      bankStatementLineId: statementEntry.id,
      statementReferenceNumber: statementEntry.reference,
      statementDate: statementEntry.date,
      statementDebitCredit: statementEntry.type === 'credit' ? 'C' : 'D',
      statementAmountLocal: statementEntry.amount,
      matchedInstructionIds: [instructionId],
      autoMatched: true,
      clearedTransitAccount: true,
      postedToLedgerAt: new Date(),
    });
  }

  async listUnmatched(): Promise<any[]> {
    return [];
  }

  async manualMatch(dto: ManualMatchDto): Promise<void> {
    await this.repo.save({
      bankStatementLineId: dto.statementLineId,
      matchedInstructionIds: [dto.instructionId],
      matchedCustomerId: dto.customerId,
      matchedInvoiceNumbers: dto.invoiceNumbers ? [dto.invoiceNumbers] : [],
      autoMatched: false,
      manuallyAdjustedBy: dto.adjustedBy,
      adjustedAt: new Date(),
      clearedTransitAccount: true,
      postedToLedgerAt: new Date(),
    });
  }

  async findById(id: string): Promise<PayReconciliationEntry | null> {
    return this.repo.findOne({ where: { id } });
  }
}
