import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardTransaction, TransactionType, FraudDecision } from '../entities/card-transaction.entity';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(CardTransaction)
    private readonly repo: Repository<CardTransaction>,
  ) {}

  async create(data: Partial<CardTransaction>): Promise<CardTransaction> {
    const txn = this.repo.create({
      ...data,
      processedAt: new Date(),
      status: 'authorized',
      fraudScore: 0,
      fraudDecision: FraudDecision.APPROVED,
      fraudFactors: [],
      rewardsEarned: 0,
      fxFeeCharged: 0,
    });
    const saved = await this.repo.save(txn);
    this.logger.log(`Transaction created: card=${data.cardId}, amount=${data.transactionAmount}`);
    return saved;
  }

  async findById(id: string): Promise<CardTransaction> {
    const txn = await this.repo.findOne({ where: { id } });
    if (!txn) throw new NotFoundException(`Transaction ${id} not found`);
    return txn;
  }

  async findByCard(cardId: string, limit: number = 50): Promise<CardTransaction[]> {
    return this.repo.find({
      where: { cardId },
      order: { processedAt: 'DESC' },
      take: limit,
    });
  }

  async findByStatus(status: string): Promise<CardTransaction[]> {
    return this.repo.find({ where: { status }, order: { processedAt: 'DESC' } });
  }

  async settleTransaction(id: string): Promise<CardTransaction> {
    const txn = await this.findById(id);
    txn.status = 'settled';
    return this.repo.save(txn);
  }

  async declineTransaction(id: string, reason: string): Promise<CardTransaction> {
    const txn = await this.findById(id);
    txn.status = 'declined';
    txn.fraudDecision = FraudDecision.DECLINED;
    txn.fraudFactors = [...(txn.fraudFactors || []), reason];
    return this.repo.save(txn);
  }

  async reverseTransaction(id: string): Promise<CardTransaction> {
    const txn = await this.findById(id);
    txn.status = 'reversed';
    return this.repo.save(txn);
  }

  async authorize(data: Partial<CardTransaction>): Promise<{ 
    approved: boolean; 
    authorizationCode: string; 
    transaction?: CardTransaction;
    declineReason?: string;
  }> {
    const authCode = Math.floor(Math.random() * 900000 + 100000).toString();
    
    const txn = await this.create({
      ...data,
      authorizationCode: authCode,
    });

    return { approved: true, authorizationCode: authCode, transaction: txn };
  }

  async getSpendingSummary(cardId: string, days: number = 30): Promise<{
    totalSpent: number;
    transactionCount: number;
    byType: Record<string, number>;
    topMerchants: Array<{ name: string; total: number }>;
  }> {
    const txns = await this.findByCard(cardId, 500);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const filtered = txns.filter(t => t.processedAt >= cutoff && t.status === 'settled');

    const totalSpent = filtered.reduce((sum, t) => sum + Number(t.billingAmount), 0);
    const byType: Record<string, number> = {};
    const merchantTotals: Record<string, number> = {};

    for (const t of filtered) {
      byType[t.transactionType] = (byType[t.transactionType] || 0) + Number(t.billingAmount);
      if (t.merchantName) {
        merchantTotals[t.merchantName] = (merchantTotals[t.merchantName] || 0) + Number(t.billingAmount);
      }
    }

    const topMerchants = Object.entries(merchantTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return { totalSpent, transactionCount: filtered.length, byType, topMerchants };
  }
}
