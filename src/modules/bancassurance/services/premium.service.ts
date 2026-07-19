import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PremiumSchedule, PremiumStatus } from '../entities/premium-schedule.entity';
import { InsurancePolicy, PolicyStatus } from '../entities/insurance-policy.entity';
import { InsuranceClaim } from '../entities/insurance-claim.entity';

@Injectable()
export class PremiumService {
  constructor(
    @InjectRepository(PremiumSchedule)
    private premiumRepo: Repository<PremiumSchedule>,
    @InjectRepository(InsurancePolicy)
    private policyRepo: Repository<InsurancePolicy>,
    @InjectRepository(InsuranceClaim)
    private claimRepo: Repository<InsuranceClaim>,
  ) {}

  async collectPremium(policyId: string, installmentNumber: number, paymentId: string): Promise<PremiumSchedule> {
    const schedule = await this.premiumRepo.findOne({
      where: { policyId, installmentNumber },
    });
    if (!schedule) throw new NotFoundException('Premium schedule not found');
    if (schedule.status === PremiumStatus.PAID) {
      throw new BadRequestException('Premium already paid');
    }

    schedule.status = PremiumStatus.PAID;
    schedule.paymentId = paymentId;
    schedule.paidAt = new Date();
    return this.premiumRepo.save(schedule);
  }

  async getOverduePremiums(): Promise<PremiumSchedule[]> {
    const today = new Date();
    return this.premiumRepo
      .createQueryBuilder('ps')
      .where('ps.status = :status', { status: PremiumStatus.PENDING })
      .andWhere('ps.due_date < :today', { today })
      .orderBy('ps.due_date', 'ASC')
      .getMany();
  }

  async markOverdue(): Promise<number> {
    const overdue = await this.getOverduePremiums();
    for (const schedule of overdue) {
      schedule.status = PremiumStatus.OVERDUE;
      await this.premiumRepo.save(schedule);
    }
    return overdue.length;
  }

  async getLossRatio(productId?: number): Promise<{
    totalPremiums: number;
    totalClaims: number;
    lossRatio: number;
  }> {
    const policyQb = this.policyRepo.createQueryBuilder('p');
    if (productId) {
      policyQb.where('p.product_id = :productId', { productId });
    }
    const policies = await policyQb.getMany();

    const policyIds = policies.map((p) => p.id);
    if (policyIds.length === 0) {
      return { totalPremiums: 0, totalClaims: 0, lossRatio: 0 };
    }

    const premiums = await this.premiumRepo
      .createQueryBuilder('ps')
      .where('ps.policy_id IN (:...policyIds)', { policyIds })
      .andWhere('ps.status = :status', { status: PremiumStatus.PAID })
      .select('SUM(ps.premium_amount)', 'total')
      .getRawOne();

    const claims = await this.claimRepo
      .createQueryBuilder('c')
      .where('c.policy_id IN (:...policyIds)', { policyIds })
      .andWhere('c.status IN (:...statuses)', { statuses: ['approved', 'paid'] })
      .select('SUM(c.approved_amount)', 'total')
      .getRawOne();

    const totalPremiums = Number(premiums?.total || 0);
    const totalClaims = Number(claims?.total || 0);
    const lossRatio = totalPremiums > 0 ? (totalClaims / totalPremiums) * 100 : 0;

    return {
      totalPremiums,
      totalClaims,
      lossRatio: Math.round(lossRatio * 100) / 100,
    };
  }

  async waivePremium(scheduleId: string): Promise<PremiumSchedule> {
    const schedule = await this.premiumRepo.findOne({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Premium schedule not found');
    schedule.status = PremiumStatus.WAIVED;
    return this.premiumRepo.save(schedule);
  }
}
