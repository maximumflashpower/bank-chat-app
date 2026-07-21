import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { NostroTransactionLog } from '../entities/nostro-transaction-log.entity';
import { NostroSuspenseItem } from '../entities/nostro-suspense-item.entity';

@Injectable()
export class NostroReconciliationService {
  constructor(
    @InjectRepository(NostroTransactionLog)
    private logRepo: Repository<NostroTransactionLog>,
    @InjectRepository(NostroSuspenseItem)
    private suspenseRepo: Repository<NostroSuspenseItem>,
  ) {}

  async autoMatchTransactions(nostroAccountId: string, cutoffDate: Date): Promise<{
    matched: number;
    unmatched: number;
    exceptions: number;
  }> {
    const transactions = await this.logRepo.find({
      where: {
        nostroAccountId,
        reconciliationStatus: 'unmatched',
      },
    });

    let matched = 0;
    let unmatched = 0;
    let exceptions = 0;

    for (const tx of transactions) {
      if (tx.effectiveValueDate <= cutoffDate) {
        const alreadyMatched = await this.suspenseRepo.count({
          where: {
            nostroAccountId,
            transactionReferenceExt: tx.transactionReferenceExt,
            status: 'resolved',
          },
        });

        if (!alreadyMatched) {
          tx.reconciliationStatus = 'matched_internal';
          await this.logRepo.save(tx);
          matched++;
        } else {
          tx.reconciliationStatus = 'exception';
          await this.logRepo.save(tx);
          exceptions++;
        }
      }
    }

    unmatched = transactions.length - matched - exceptions;

    return { matched, unmatched, exceptions };
  }

  async getUnmatchedTransactions(nostroAccountId: string): Promise<NostroTransactionLog[]> { 
    return this.logRepo.find({
      where: {
        nostroAccountId,
        reconciliationStatus: 'unmatched',
      },
      order: { postedAt: 'DESC' },
    });
  }

  async getSuspenseItems(nostroAccountId: string): Promise<NostroSuspenseItem[]> {
    return this.suspenseRepo.find({
      where: {
        nostroAccountId,
        status: 'open',
      },
      order: { createdAt: 'DESC' },
    });
  }

  async createSuspenseItem(txId: string, reason: string): Promise<NostroSuspenseItem> {
    const tx = await this.logRepo.findOne({ where: { id: txId } });
    if (!tx) throw new NotFoundException(`Transaction ${txId} not found`);

    const item = this.suspenseRepo.create({
      nostroAccountId: tx.nostroAccountId,
      nostroTransactionLogId: tx.id,
      transactionReferenceExt: tx.transactionReferenceExt,
      amount: tx.amount,
      currencyIso: tx.currencyIso,
      debitCreditIndicator: tx.debitCreditIndicator,
      valueDate: tx.effectiveValueDate,
      suspenseReason: reason,
      status: 'open',
    });

    return this.suspenseRepo.save(item);
  }

  async resolveSuspenseItem(itemId: string, action: string, notes: string, resolvedByUserId: string): Promise<NostroSuspenseItem> {
    const item = await this.suspenseRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Suspense item ${itemId} not found`);

    item.status = 'resolved';
    item.resolutionAction = action;
    item.resolutionNotes = notes;
    item.resolvedByUserId = resolvedByUserId;
    item.resolvedAt = new Date();

    const tx = await this.logRepo.findOne({ where: { id: item.nostroTransactionLogId } });
    if (tx) {
      tx.reconciliationStatus = 'matched_manual';
      await this.logRepo.save(tx);
    }

    return this.suspenseRepo.save(item);
  }

  async getReconciliationSummary(nostroAccountId: string, asOfDate: Date): Promise<{
    nostroAccountId: string;
    asOfDate: Date;
    totalTransactions: number;
    matched: number;
    unmatched: number;
    exceptions: number;
    openSuspenseCount: number;
    totalOpenSuspenseAmount: number;
  }> {
    const transactions = await this.logRepo.find({
      where: {
        nostroAccountId,
        effectiveValueDate: LessThan(asOfDate),
      },
    });

    const matched = transactions.filter(t => t.reconciliationStatus === 'matched_internal').length;
    const unmatched = transactions.filter(t => t.reconciliationStatus === 'unmatched').length;
    const exceptions = transactions.filter(t => t.reconciliationStatus === 'exception').length;

    const openSuspense = await this.suspenseRepo.find({
      where: {
        nostroAccountId,
        status: 'open',
      },
    });

    const totalOpenSuspenseAmount = openSuspense.reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      nostroAccountId,
      asOfDate,
      totalTransactions: transactions.length,
      matched,
      unmatched,
      exceptions,
      openSuspenseCount: openSuspense.length,
      totalOpenSuspenseAmount,
    };
  }

  async investigateTransaction(txId: string): Promise<{
    transaction: any;
    relatedSuspenseItems: any[];
    matchingAttempts: any[];
  }> {
    const tx = await this.logRepo.findOne({ where: { id: txId } });
    if (!tx) throw new NotFoundException(`Transaction ${txId} not found`);

    const relatedSuspense = await this.suspenseRepo.find({
      where: { nostroTransactionLogId: txId },
    });

    return {
      transaction: tx,
      relatedSuspenseItems: relatedSuspense,
      matchingAttempts: [],
    };
  }
}
