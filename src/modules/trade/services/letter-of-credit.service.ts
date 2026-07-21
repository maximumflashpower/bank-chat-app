import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LetterOfCredit } from '../entities/letter-of-credit.entity';
import { LCStatus } from '../enums/lc-status.enum';

@Injectable()
export class LetterOfCreditService {
  constructor(
    @InjectRepository(LetterOfCredit)
    private repo: Repository<LetterOfCredit>,
  ) {}

  async create(lcData: Partial<LetterOfCredit>): Promise<LetterOfCredit> {
    const lcNumber = this.generateLcNumber();
    const lc = this.repo.create({ ...lcData, lcNumber, status: LCStatus.ISSUED });
    return this.repo.save(lc);
  }

  async findById(id: string): Promise<LetterOfCredit> {
    const lc = await this.repo.findOne({ where: { id } });
    if (!lc) throw new NotFoundException(`LC ${id} not found`);
    return lc;
  }

  async findByNumber(lcNumber: string): Promise<LetterOfCredit | null> {
    return this.repo.findOne({ where: { lcNumber } });
  }

  async findAll(filters?: { status?: LCStatus; applicantId?: string }): Promise<LetterOfCredit[]> {
    const qb = this.repo.createQueryBuilder('lc');
    if (filters?.status) qb.andWhere('lc.status = :status', { status: filters.status });
    if (filters?.applicantId) qb.andWhere('lc.applicantName = :applicantName', { applicantName: filters.applicantId });
    return qb.getMany();
  }

  async amend(id: string, amendments: Partial<LetterOfCredit>): Promise<LetterOfCredit> {
    const lc = await this.findById(id);
    Object.assign(lc, amendments);
    lc.revisionCount += 1;
    lc.lastAmendmentDate = new Date();
    if (amendments.status) lc.status = amendments.status;
    return this.repo.save(lc);
  }

  async close(id: string, reason: string): Promise<LetterOfCredit> {
    const lc = await this.findById(id);
    lc.status = LCStatus.CLOSED;
    return this.repo.save(lc);
  }

  async cancel(id: string, reason: string): Promise<LetterOfCredit> {
    const lc = await this.findById(id);
    lc.status = LCStatus.CANCELLED;
    return this.repo.save(lc);
  }

  async extendExpiry(id: string, newExpiryDate: Date): Promise<LetterOfCredit> {
    const lc = await this.findById(id);
    lc.expiryDate = newExpiryDate;
    lc.revisionCount += 1;
    lc.lastAmendmentDate = new Date();
    return this.repo.save(lc);
  }

  async notifyExpiry(id: string): Promise<void> {
    const lc = await this.findById(id);
    lc.expiryNotificationDate = new Date();
    await this.repo.save(lc);
  }

  private generateLcNumber(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    return `LC-${yyyy}${mm}-${random}`;
  }

  async calculateRiskScore(lc: LetterOfCredit): Promise<number> {
    let score = 50;
    if (lc.amount > 1000000) score += 20;
    if (lc.countryOfOrigin === 'high-risk-country') score += 20;
    if (!lc.confirmed) score += 10;
    return Math.min(score, 100);
  }

  async getUtilizationRate(applicantId: string): Promise<number> {
    const lcs = await this.findAll({ applicantId });
    const activeCount = lcs.filter(lc => [LCStatus.ISSUED, LCStatus.ADVISED].includes(lc.status)).length;
    return lcs.length > 0 ? (activeCount / lcs.length) * 100 : 0;
  }

  async validateCompliance(lc: LetterOfCredit): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];
    if (!lc.beneficiarySwiftCode && lc.beneficiaryBankName) issues.push('Missing SWIFT code');
    if (lc.amount <= 0) issues.push('Invalid amount');
    if (lc.issueDate > lc.expiryDate) issues.push('Expiry before issue');
    return { compliant: issues.length === 0, issues };
  }
}
