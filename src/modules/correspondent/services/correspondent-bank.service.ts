import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorrespondentBank } from '../entities/correspondent-bank.entity';

@Injectable()
export class CorrespondentBankService {
  constructor(
    @InjectRepository(CorrespondentBank)
    private repo: Repository<CorrespondentBank>,
  ) {}

  async create(data: Partial<CorrespondentBank>): Promise<CorrespondentBank> {
    const existing = await this.repo.findOne({
      where: { bankCodeSwift: data.bankCodeSwift },
    });
    if (existing) {
      throw new ConflictException('Correspondent bank already exists with this SWIFT code');
    }
    const bank = this.repo.create(data);
    return this.repo.save(bank);
  }

  async findById(id: string): Promise<CorrespondentBank> {
    const bank = await this.repo.findOne({ where: { id } });
    if (!bank) throw new NotFoundException(`Correspondent bank ${id} not found`);
    return bank;
  }

  async findBySwift(bic: string): Promise<CorrespondentBank> {
    const bank = await this.repo.findOne({ where: { bankCodeSwift: bic } });
    if (!bank) throw new NotFoundException(`Bank with SWIFT ${bic} not found`);
    return bank;
  }

  async findAll(activeOnly: boolean = true): Promise<CorrespondentBank[]> {
    const query = this.repo.createQueryBuilder('cb');
    if (activeOnly) {
      query.where('cb.relationshipStatus = :status', { status: 'active' });
    }
    return query.getMany();
  }

  async update(id: string, data: Partial<CorrespondentBank>): Promise<CorrespondentBank> {
    await this.findById(id);
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async deactivate(id: string, terminationDate: Date, reason?: string): Promise<void> {
    const bank = await this.findById(id);
    if (bank.relationshipStatus === 'terminated') {
      throw new ConflictException('Bank already terminated');
    }
    await this.repo.update(id, {
      relationshipStatus: 'terminated',
      terminationDate,
    });
  }

  async updateRiskProfile(
    id: string,
    riskScore: number,
    countryRisk: string,
    amlGrade?: string,
  ): Promise<CorrespondentBank> {
    await this.findById(id);
    await this.repo.update(id, {
      riskScoreInternal: riskScore,
      countryRiskRating: countryRisk,
      amlProgramGrade: amlGrade,
    });
    return this.findById(id);
  }

  async updateComplianceStatus(
    id: string,
    kycStatus: string,
    verifiedAt?: Date,
  ): Promise<CorrespondentBank> {
    await this.findById(id);
    await this.repo.update(id, {
      kycStatus,
      kybDocumentationVerifiedAt: verifiedAt,
    });
    return this.findById(id);
  }

  async updateAnnualReview(id: string): Promise<CorrespondentBank> {
    await this.findById(id);
    await this.repo.update(id, { annualReviewDate: new Date() });
    return this.findById(id);
  }

  async recordSanctionScreen(id: string, lastScreenDate: Date): Promise<CorrespondentBank> {
    await this.findById(id);
    await this.repo.update(id, { lastSanctionScreenDate: lastScreenDate });
    return this.findById(id);
  }

  async updateExposure(id: string, currentExposureUsd: number): Promise<CorrespondentBank> {
    await this.findById(id);
    await this.repo.update(id, { currentExposureUsd });
    return this.findById(id);
  }

  async getListOfCorrespondentsWithCountryExposure(countryCode: string): Promise<any[]> {
    return this.repo
      .createQueryBuilder('cb')
      .where('cb.headquartersCountry = :country', { country: countryCode })
      .addSelect('cb.currentExposureUsd')
      .getMany();
  }

  async getHighRiskCorrespondents(riskThreshold: number): Promise<CorrespondentBank[]> {
    return this.repo
      .createQueryBuilder('cb')
      .where('cb.riskScoreInternal >= :threshold', { threshold: riskThreshold })
      .andWhere('cb.relationshipStatus = :status', { status: 'active' })
      .getMany();
  }
}
