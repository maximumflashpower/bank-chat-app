import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsurancePolicy, PolicyStatus } from '../entities/insurance-policy.entity';
import { PolicyEndorsement, EndorsementStatus } from '../entities/policy-endorsement.entity';
import { PremiumSchedule, PremiumStatus } from '../entities/premium-schedule.entity';
import { AgentCommission, CommissionStatus } from '../entities/agent-commission.entity';
import { IssuePolicyDto } from '../dto/issue-policy.dto';
import { EndorsementDto } from '../dto/endorsement.dto';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(InsurancePolicy)
    private policyRepo: Repository<InsurancePolicy>,
    @InjectRepository(PolicyEndorsement)
    private endorsementRepo: Repository<PolicyEndorsement>,
    @InjectRepository(PremiumSchedule)
    private premiumRepo: Repository<PremiumSchedule>,
    @InjectRepository(AgentCommission)
    private commissionRepo: Repository<AgentCommission>,
  ) {}

  async issue(dto: IssuePolicyDto): Promise<InsurancePolicy> {
    const policyNumber = `POL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

    const startDate = new Date(dto.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + dto.termMonths);

    const policy = this.policyRepo.create({
      policyNumber,
      userId: dto.userId,
      productId: dto.productId,
      quoteId: dto.quoteId || null,
      coverageLevel: dto.coverageLevel,
      premiumAmount: dto.premiumAmount,
      premiumFrequency: dto.premiumFrequency as any,
      currency: dto.currency,
      deductible: dto.deductible || null,
      coverageLimits: dto.coverageLimits,
      startDate,
      endDate,
      renewalType: dto.renewalType as any,
      status: PolicyStatus.ACTIVE,
      agentId: dto.agentId || null,
      underwriterId: dto.underwriterId || null,
      metadata: {},
    });

    const saved = await this.policyRepo.save(policy);

    await this.generatePremiumSchedule(saved.id, dto.premiumAmount, dto.premiumFrequency, startDate, dto.termMonths, dto.currency);

    if (dto.agentId) {
      await this.createCommission(dto.agentId, saved.id, dto.premiumAmount, dto.currency);
    }

    return saved;
  }

  async findById(id: string): Promise<InsurancePolicy> {
    const policy = await this.policyRepo.findOne({ where: { id } });
    if (!policy) throw new NotFoundException('Policy not found');
    return policy;
  }

  async findByUser(userId: string): Promise<InsurancePolicy[]> {
    return this.policyRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async endorse(policyId: string, dto: EndorsementDto): Promise<PolicyEndorsement> {
    await this.findById(policyId);
    const endorsement = this.endorsementRepo.create({
      policyId,
      endorsementType: dto.endorsementType as any,
      changes: dto.changes,
      premiumAdjustment: dto.premiumAdjustment || 0,
      status: EndorsementStatus.PENDING,
      effectiveDate: new Date(dto.effectiveDate),
    });
    return this.endorsementRepo.save(endorsement);
  }

  async approveEndorsement(endorsementId: string, approvedBy: string): Promise<PolicyEndorsement> {
    const endorsement = await this.endorsementRepo.findOne({ where: { id: endorsementId } });
    if (!endorsement) throw new NotFoundException('Endorsement not found');
    endorsement.status = EndorsementStatus.APPROVED;
    endorsement.approvedBy = approvedBy;
    return this.endorsementRepo.save(endorsement);
  }

  async renew(policyId: string): Promise<InsurancePolicy> {
    const policy = await this.findById(policyId);
    const newEndDate = new Date(policy.endDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    policy.endDate = newEndDate;
    policy.status = PolicyStatus.ACTIVE;
    return this.policyRepo.save(policy);
  }

  async cancel(policyId: string, reason: string): Promise<InsurancePolicy> {
    const policy = await this.findById(policyId);
    if (policy.status === PolicyStatus.CANCELLED) {
      throw new BadRequestException('Policy already cancelled');
    }
    policy.status = PolicyStatus.CANCELLED;
    policy.cancellationReason = reason;
    return this.policyRepo.save(policy);
  }

  async getPremiumHistory(policyId: string): Promise<PremiumSchedule[]> {
    return this.premiumRepo.find({ where: { policyId }, order: { installmentNumber: 'ASC' } });
  }

  private async generatePremiumSchedule(
    policyId: string,
    premiumAmount: number,
    frequency: string,
    startDate: Date,
    termMonths: number,
    currency: string,
  ): Promise<void> {
    const installments = frequency === 'monthly' ? termMonths : frequency === 'quarterly' ? Math.ceil(termMonths / 3) : frequency === 'semi_annual' ? Math.ceil(termMonths / 6) : 1;
    const amountPerInstallment = Number(premiumAmount) / installments;

    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(startDate);
      if (frequency === 'monthly') dueDate.setMonth(dueDate.getMonth() + (i - 1));
      else if (frequency === 'quarterly') dueDate.setMonth(dueDate.getMonth() + (i - 1) * 3);
      else if (frequency === 'semi_annual') dueDate.setMonth(dueDate.getMonth() + (i - 1) * 6);

      const schedule = this.premiumRepo.create({
        policyId,
        installmentNumber: i,
        dueDate,
        premiumAmount: Math.round(amountPerInstallment * 100) / 100,
        currency,
        status: PremiumStatus.PENDING,
      });
      await this.premiumRepo.save(schedule);
    }
  }

  private async createCommission(agentId: string, policyId: string, premiumAmount: number, currency: string): Promise<void> {
    const commissionPct = 10;
    const commissionAmount = (Number(premiumAmount) * commissionPct) / 100;
    const commission = this.commissionRepo.create({
      agentId,
      policyId,
      commissionPct,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      currency,
      status: CommissionStatus.ACCRUED,
    });
    await this.commissionRepo.save(commission);
  }
}
