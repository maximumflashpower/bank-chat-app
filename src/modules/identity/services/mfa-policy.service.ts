import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MfaPolicy } from '../entities/mfa-policy.entity';
import { MfaPolicyUpdateDto } from '../dto/mfa-policy-update.dto';

@Injectable()
export class MfaPolicyService {
  constructor(
    @InjectRepository(MfaPolicy)
    private readonly repo: Repository<MfaPolicy>,
  ) {}

  async createPolicy(name: string, createdBy: string, dto?: Partial<MfaPolicy>): Promise<MfaPolicy> {
    const policy = this.repo.create({
      name,
      createdBy,
      ...dto,
    });
    return this.repo.save(policy);
  }

  async updatePolicy(policyId: string, updates: MfaPolicyUpdateDto): Promise<MfaPolicy> {
    await this.repo.update(policyId, updates);
    return this.repo.findOneOrFail({ where: { id: policyId } });
  }

  async getActivePolicy(): Promise<MfaPolicy | null> {
    return this.repo.findOne({ order: { createdAt: 'DESC' } });
  }

  async deletePolicy(policyId: string): Promise<void> {
    await this.repo.delete(policyId);
  }

  async evaluateRiskContext(riskScore: number, isNewDevice: boolean, location: string, hour: number): Promise<boolean> {
    const policy = await this.getActivePolicy();
    if (!policy) return false;

    const riskThresholdHigh = Number(policy.riskThresholdHigh) || 5.0;
    return riskScore >= riskThresholdHigh;
  }
}
