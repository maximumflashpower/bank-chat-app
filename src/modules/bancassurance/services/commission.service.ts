import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentCommission, CommissionStatus } from '../entities/agent-commission.entity';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(AgentCommission)
    private repo: Repository<AgentCommission>,
  ) {}

  async findByAgent(agentId: string): Promise<AgentCommission[]> {
    return this.repo.find({ where: { agentId }, order: { createdAt: 'DESC' } });
  }

  async getPortfolio(agentId: string): Promise<{
    totalCommissions: number;
    paidCommissions: number;
    pendingCommissions: number;
    policyCount: number;
  }> {
    const commissions = await this.findByAgent(agentId);
    const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const paidCommissions = commissions
      .filter((c) => c.status === CommissionStatus.PAID)
      .reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const pendingCommissions = commissions
      .filter((c) => c.status === CommissionStatus.ACCRUED || c.status === CommissionStatus.PENDING)
      .reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const uniquePolicies = new Set(commissions.map((c) => c.policyId));

    return {
      totalCommissions,
      paidCommissions,
      pendingCommissions,
      policyCount: uniquePolicies.size,
    };
  }

  async payCommission(commissionId: string): Promise<AgentCommission> {
    const commission = await this.repo.findOne({ where: { id: commissionId } });
    if (!commission) throw new NotFoundException('Commission not found');
    commission.status = CommissionStatus.PAID;
    commission.paidAt = new Date();
    return this.repo.save(commission);
  }

  async reverseCommission(commissionId: string): Promise<AgentCommission> {
    const commission = await this.repo.findOne({ where: { id: commissionId } });
    if (!commission) throw new NotFoundException('Commission not found');
    commission.status = CommissionStatus.REVERSED;
    return this.repo.save(commission);
  }
}
