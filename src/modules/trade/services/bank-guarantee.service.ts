import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankGuarantee } from '../entities/bank-guarantee.entity';
import { GuaranteeStatus } from '../enums/guarantee-status.enum';

@Injectable()
export class BankGuaranteeService {
  constructor(
    @InjectRepository(BankGuarantee)
    private repo: Repository<BankGuarantee>,
  ) {}

  async create(guaranteeData: Partial<BankGuarantee>): Promise<BankGuarantee> {
    const guaranteeNumber = this.generateGuaranteeNumber();
    const guarantee = this.repo.create({ ...guaranteeData, guaranteeNumber, status: GuaranteeStatus.ACTIVE });
    return this.repo.save(guarantee);
  }

  async findById(id: string): Promise<BankGuarantee> {
    const guarantee = await this.repo.findOne({ where: { id } });
    if (!guarantee) throw new NotFoundException(`Guarantee ${id} not found`);
    return guarantee;
  }

  async findByNumber(guaranteeNumber: string): Promise<BankGuarantee | null> {
    return this.repo.findOne({ where: { guaranteeNumber } });
  }

  async findAll(filters?: { status?: GuaranteeStatus; applicantId?: string }): Promise<BankGuarantee[]> {
    const qb = this.repo.createQueryBuilder('g');
    if (filters?.status) qb.andWhere('g.status = :status', { status: filters.status });
    if (filters?.applicantId) qb.andWhere('g.applicantName = :applicantName', { applicantName: filters.applicantId });
    return qb.getMany();
  }

  async claim(id: string, claimAmount: number, reason: string): Promise<BankGuarantee> {
    const guarantee = await this.findById(id);
    guarantee.claimAmount = claimAmount;
    guarantee.lastClaimDate = new Date();
    guarantee.status = GuaranteeStatus.CLAIMED;
    return this.repo.save(guarantee);
  }

  async release(id: string): Promise<BankGuarantee> {
    const guarantee = await this.findById(id);
    guarantee.status = GuaranteeStatus.RELEASED;
    return this.repo.save(guarantee);
  }

  async expire(id: string): Promise<BankGuarantee> {
    const guarantee = await this.findById(id);
    guarantee.status = GuaranteeStatus.EXPIRED;
    return this.repo.save(guarantee);
  }

  async extend(id: string, newExpiryDate: Date): Promise<BankGuarantee> {
    const guarantee = await this.findById(id);
    guarantee.expiryDate = newExpiryDate;
    guarantee.extended = true;
    guarantee.revisionCount += 1;
    return this.repo.save(guarantee);
  }

  async cancel(id: string, reason: string): Promise<BankGuarantee> {
    const guarantee = await this.findById(id);
    guarantee.status = GuaranteeStatus.CANCELLED;
    return this.repo.save(guarantee);
  }

  async calculatePremium(amount: number, tenorMonths: number): Promise<number> {
    const baseRate = 0.02;
    const adjustedRate = amount > 1000000 ? 0.025 : baseRate;
    return amount * adjustedRate * (tenorMonths / 12);
  }

  async getExposure(applicantId: string): Promise<number> {
    const guarantees = await this.findAll({ applicantId });
    return guarantees.reduce((sum, g) => sum + (g.amount - g.claimAmount), 0);
  }

  async validateCounterGuarantee(counterGuarantor: string): Promise<boolean> {
    const approvedCounterGuarantors = ['Global Bank Corp', 'International Trust'];
    return approvedCounterGuarantors.includes(counterGuarantor);
  }

  private generateGuaranteeNumber(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    return `BG-${yyyy}${mm}-${random}`;
  }
}
