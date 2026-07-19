import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessPositivePayRecord, PositivePayStatus, MatchResult, PositivePayDecision } from '../entities/business-positive-pay-record.entity';

@Injectable()
export class PositivePayService {
  private readonly logger = new Logger(PositivePayService.name);

  constructor(
    @InjectRepository(BusinessPositivePayRecord)
    private readonly repo: Repository<BusinessPositivePayRecord>,
  ) {}

  async createCheck(accountId: string, checkNumber: string, amount: number, payeeName: string, issueDate: Date): Promise<BusinessPositivePayRecord> {
    const record = this.repo.create({
      accountId,
      checkNumber,
      checkAmount: amount,
      payeeName,
      issueDate,
      status: PositivePayStatus.ISSUED,
      decision: PositivePayDecision.PENDING,
      uploadedAt: new Date(),
    });

    const saved = await this.repo.save(record);
    this.logger.log(`Positive pay check created: ${checkNumber}, amount=${amount}`);
    return saved;
  }

  async findById(id: string): Promise<BusinessPositivePayRecord> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Positive pay record ${id} not found`);
    return record;
  }

  async findByAccount(accountId: string): Promise<BusinessPositivePayRecord[]> {
    return this.repo.find({ 
      where: { accountId },
      order: { issueDate: 'DESC' },
    });
  }

  async processPresentment(checkNumber: string, presentedAmount: number, presentedPayee: string): Promise<{
    matchResult: MatchResult;
    decision: PositivePayDecision;
    message: string;
  }> {
    const records = await this.repo.find({ where: { checkNumber } });
    
    if (records.length === 0) {
      return { matchResult: MatchResult.NOT_LISTED, decision: PositivePayDecision.RETURN, message: 'Check not found in positive pay list' };
    }

    const record = records[0];
    let matchResult: MatchResult;

    if (Math.abs(presentedAmount - Number(record.checkAmount)) < 0.01 && 
        presentedPayee.toLowerCase() === record.payeeName.toLowerCase()) {
      matchResult = MatchResult.EXACT;
    } else if (Math.abs(presentedAmount - Number(record.checkAmount)) >= 0.01) {
      matchResult = MatchResult.MISMATCH_AMOUNT;
    } else {
      matchResult = MatchResult.MISMATCH_PAYEE;
    }

    const decision = this.makeDecision(matchResult, presentedAmount, record);

    record.presentedCheckNumber = checkNumber;
    record.presentedAmount = presentedAmount;
    record.presentedPayee = presentedPayee;
    record.matchResult = matchResult;
    record.decision = decision;
    record.status = decision === PositivePayDecision.PAY ? PositivePayStatus.PAID : PositivePayStatus.RETURNED;
    
    await this.repo.save(record);
    this.logger.log(`Positive pay processed: ${checkNumber}, match=${matchResult}, decision=${decision}`);

    return { matchResult, decision, message: `${decision === PositivePayDecision.PAY ? 'Paid' : 'Returned'} - ${matchResult}` };
  }

  private makeDecision(matchResult: MatchResult, presentedAmount: number, record: BusinessPositivePayRecord): PositivePayDecision {
    switch (matchResult) {
      case MatchResult.EXACT:
        return PositivePayDecision.PAY;
      case MatchResult.MISMATCH_AMOUNT:
        return record.decision === PositivePayDecision.INVESTIGATE ? PositivePayDecision.INVESTIGATE : PositivePayDecision.RETURN;
      case MatchResult.MISMATCH_PAYEE:
        return PositivePayDecision.INVESTIGATE;
      case MatchResult.NOT_LISTED:
        return PositivePayDecision.RETURN;
      default:
        return PositivePayDecision.PENDING;
    }
  }

  async markDecided(id: string, decision: PositivePayDecision, decidedBy: string): Promise<BusinessPositivePayRecord> {
    const record = await this.findById(id);
    record.decision = decision;
    record.decidedBy = decidedBy;
    record.decidedAt = new Date();
    record.status = decision === PositivePayDecision.PAY ? PositivePayStatus.PAID : 
                    decision === PositivePayDecision.RETURN ? PositivePayStatus.RETURNED : record.status;
    return this.repo.save(record);
  }

  async voidCheck(id: string): Promise<BusinessPositivePayRecord> {
    const record = await this.findById(id);
    record.status = PositivePayStatus.VOID;
    record.decision = PositivePayDecision.RETURN;
    return this.repo.save(record);
  }

  async getStatistics(accountId: string, days: number = 30): Promise<{
    totalChecks: number;
    paidCount: number;
    returnedCount: number;
    voidedCount: number;
    investigatedCount: number;
    totalAmount: number;
  }> {
    const records = await this.findByAccount(accountId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const filtered = records.filter(r => r.createdAt >= cutoff);

    return {
      totalChecks: filtered.length,
      paidCount: filtered.filter(r => r.status === PositivePayStatus.PAID).length,
      returnedCount: filtered.filter(r => r.status === PositivePayStatus.RETURNED).length,
      voidedCount: filtered.filter(r => r.status === PositivePayStatus.VOID).length,
      investigatedCount: filtered.filter(r => r.decision === PositivePayDecision.INVESTIGATE).length,
      totalAmount: filtered.reduce((sum, r) => sum + Number(r.checkAmount), 0),
    };
  }
}
