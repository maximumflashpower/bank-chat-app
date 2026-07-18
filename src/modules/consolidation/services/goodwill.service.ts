import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsolidationAcquisitionRegister, AcquisitionStatus } from '../entities/consolidation-acquisition-register.entity';

@Injectable()
export class GoodwillService {
  private readonly logger = new Logger(GoodwillService.name);

  constructor(
    @InjectRepository(ConsolidationAcquisitionRegister)
    private readonly repo: Repository<ConsolidationAcquisitionRegister>,
  ) {}

  async calculateGoodwill(acquisitionId: string): Promise<{
    goodwill: number;
    nciGoodwill: number;
    parentGoodwill: number;
  }> {
    const acq = await this.findById(acquisitionId);
    const netAssets = Number(acq.fairValueIdentifiableAssets || 0) - Number(acq.fairValueIdentifiableLiabilities || 0);
    const parentPct = Number(acq.ownershipAcquiredPct) / 100;

    const parentGoodwill = Math.round((Number(acq.transactionValue) - netAssets * parentPct) * 100) / 100;
    const nciPct = 1 - parentPct;
    const nciGoodwill = Math.round((Number(acq.transactionValue) * nciPct) * 100) / 100;
    const goodwill = parentGoodwill + nciGoodwill;

    acq.goodwillCalculated = goodwill;
    await this.repo.save(acq);

    this.logger.log(
      `Goodwill calculated for ${acq.acquisitionCode}: total=${goodwill}, parent=${parentGoodwill}, NCI=${nciGoodwill}`,
    );

    return { goodwill, nciGoodwill, parentGoodwill };
  }

  async testImpairment(acquisitionId: string, carryingValue: number, recoverableAmount: number): Promise<{
    impairmentLoss: number;
    impairedCarryingValue: number;
    isImpaired: boolean;
  }> {
    const acq = await this.findById(acquisitionId);
    const impairmentLoss = Math.max(0, carryingValue - recoverableAmount);
    const isImpaired = impairmentLoss > 0;

    if (isImpaired) {
      acq.goodwillImpairment = Number(acq.goodwillImpairment || 0) + impairmentLoss;
      acq.status = AcquisitionStatus.IMPAIRMENT_TESTING;
      await this.repo.save(acq);
      this.logger.warn(
        `Goodwill impairment detected for ${acq.acquisitionCode}: loss=${impairmentLoss}`,
      );
    }

    return {
      impairmentLoss,
      impairedCarryingValue: carryingValue - impairmentLoss,
      isImpaired,
    };
  }

  async getGoodwillSummary(): Promise<{
    totalGoodwill: number;
    totalImpairment: number;
    netGoodwill: number;
    acquisitions: number;
  }> {
    const acquisitions = await this.repo.find();
    const totalGoodwill = acquisitions.reduce((s, a) => s + Number(a.goodwillCalculated || 0), 0);
    const totalImpairment = acquisitions.reduce((s, a) => s + Number(a.goodwillImpairment || 0), 0);

    return {
      totalGoodwill,
      totalImpairment,
      netGoodwill: totalGoodwill - totalImpairment,
      acquisitions: acquisitions.length,
    };
  }

  async findById(id: string): Promise<ConsolidationAcquisitionRegister> {
    const acq = await this.repo.findOne({ where: { id } });
    if (!acq) throw new NotFoundException(`Acquisition ${id} not found`);
    return acq;
  }
}
