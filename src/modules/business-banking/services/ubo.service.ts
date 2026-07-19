import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessUboRegistration, KycScreeningStatus, PepStatus, SanctionsScreeningStatus } from '../entities/business-ubo-registration.entity';

@Injectable()
export class UboService {
  private readonly logger = new Logger(UboService.name);

  constructor(
    @InjectRepository(BusinessUboRegistration)
    private readonly repo: Repository<BusinessUboRegistration>,
  ) {}

  async registerUbo(data: Partial<BusinessUboRegistration>): Promise<BusinessUboRegistration> {
    const ubo = this.repo.create({
      ...data,
      kycScreeningStatus: KycScreeningStatus.PENDING,
      pepStatus: PepStatus.NOT_PEP,
      sanctionsScreeningStatus: SanctionsScreeningStatus.CLEAR,
      adverseMediaFlag: false,
      ownershipThresholdMet: (Number(data.ownershipPercentage) || 0) >= 25,
    });

    const saved = await this.repo.save(ubo);
    this.logger.log(`UBO registered: ${ubo.uboFullName}, ownership=${ubo.ownershipPercentage}%`);
    return saved;
  }

  async findById(id: string): Promise<BusinessUboRegistration> {
    const ubo = await this.repo.findOne({ where: { id } });
    if (!ubo) throw new NotFoundException(`UBO registration ${id} not found`);
    return ubo;
  }

  async findByOrganization(organizationId: string): Promise<BusinessUboRegistration[]> {
    return this.repo.find({ 
      where: { organizationId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateOwnership(id: string, ownershipPercentage: number): Promise<BusinessUboRegistration> {
    const ubo = await this.findById(id);
    ubo.ownershipPercentage = ownershipPercentage;
    ubo.ownershipThresholdMet = ownershipPercentage >= 25;
    return this.repo.save(ubo);
  }

  async verifyKyc(id: string): Promise<BusinessUboRegistration> {
    const ubo = await this.findById(id);
    ubo.kycScreeningStatus = KycScreeningStatus.VERIFIED;
    ubo.verifiedAt = new Date();
    return this.repo.save(ubo);
  }

  async markAsPep(id: string, pepStatus: PepStatus): Promise<BusinessUboRegistration> {
    const ubo = await this.findById(id);
    ubo.pepStatus = pepStatus;
    if (pepStatus !== PepStatus.NOT_PEP) {
      ubo.kycScreeningStatus = KycScreeningStatus.PENDING;
    }
    return this.repo.save(ubo);
  }

  async screenSanctions(id: string, status: SanctionsScreeningStatus): Promise<BusinessUboRegistration> {
    const ubo = await this.findById(id);
    ubo.sanctionsScreeningStatus = status;
    if (status === SanctionsScreeningStatus.MATCH || status === SanctionsScreeningStatus.REVIEW) {
      ubo.kycScreeningStatus = KycScreeningStatus.PENDING;
    }
    return this.repo.save(ubo);
  }

  async flagAdverseMedia(id: string, flagged: boolean): Promise<BusinessUboRegistration> {
    const ubo = await this.findById(id);
    ubo.adverseMediaFlag = flagged;
    if (flagged) {
      ubo.kycScreeningStatus = KycScreeningStatus.PENDING;
    }
    return this.repo.save(ubo);
  }

  async rejectUbo(id: string, reason: string): Promise<BusinessUboRegistration> {
    const ubo = await this.findById(id);
    ubo.kycScreeningStatus = KycScreeningStatus.REJECTED;
    return this.repo.save(ubo);
  }

  async getRiskProfile(id: string): Promise<{
    kycStatus: KycScreeningStatus;
    pepStatus: PepStatus;
    sanctionsStatus: SanctionsScreeningStatus;
    adverseMedia: boolean;
    ownershipPercent: number;
    riskScore: number;
  }> {
    const ubo = await this.findById(id);

    let riskScore = 0;
    if (ubo.pepStatus === PepStatus.PEP || ubo.pepStatus === PepStatus.PEP_ASSOCIATE) riskScore += 40;
    if (ubo.sanctionsScreeningStatus === SanctionsScreeningStatus.MATCH) riskScore += 50;
    if (ubo.adverseMediaFlag) riskScore += 30;
    if (ubo.kycScreeningStatus === KycScreeningStatus.PENDING) riskScore += 20;

    return {
      kycStatus: ubo.kycScreeningStatus,
      pepStatus: ubo.pepStatus,
      sanctionsStatus: ubo.sanctionsScreeningStatus,
      adverseMedia: ubo.adverseMediaFlag,
      ownershipPercent: Number(ubo.ownershipPercentage),
      riskScore: Math.min(100, riskScore),
    };
  }
}
