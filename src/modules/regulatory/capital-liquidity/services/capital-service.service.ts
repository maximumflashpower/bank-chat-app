import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CapitalRatio } from '../entities/capital-ratio.entity';
import { CapitalRatioType, CapitalAdequacyStatus, BufferType } from '../entities/capital-liquidity-status.enum';

@Injectable()
export class CapitalService {
  private readonly logger = new Logger(CapitalService.name);

  constructor(
    @InjectRepository(CapitalRatio)
    private readonly ratioRepo: Repository<CapitalRatio>,
  ) {}

  /**
   * REG-CAP-001: Calculate Basel III Capital Ratios (CET1, Tier 1, Total Capital)
   */
  async calculateCapitalRatio(
    ratioType: CapitalRatioType,
    capitalAmount: number,
    riskWeightedAssets: number,
    reportingDate: Date,
    calculatedByUserId: string,
    bufferBreakdown?: {
      bufferType: BufferType;
      amount: number;
      requirement: number;
    }[],
  ): Promise<CapitalRatio> {
    const calculationReference = this.generateCalculationReference(ratioType);

    const minimumRequirement = this.getMinimumRequirement(ratioType);
    const bufferRequirement = bufferBreakdown?.reduce((sum, b) => sum + b.requirement, 0) ?? 0;
    const totalRequirement = minimumRequirement + bufferRequirement;

    const calculatedRatio = riskWeightedAssets > 0 ? capitalAmount / riskWeightedAssets : 0;
    const surplusAboveMinimum = capitalAmount - (minimumRequirement * riskWeightedAssets);
    const surplusAboveBuffer = capitalAmount - (totalRequirement * riskWeightedAssets);

    const status = this.calculateAdequacyStatus(calculatedRatio, minimumRequirement, bufferRequirement);

    const ratio = this.ratioRepo.create({
      calculationReference,
      reportingDate,
      ratioType,
      capitalAmount,
      riskWeightedAssets,
      calculatedRatio,
      minimumRequirement,
      bufferRequirement,
      totalRequirement,
      adequacyStatus: status,
      surplusAboveMinimum,
      surplusAboveBuffer,
      bufferBreakdown,
      calculatedByUserId,
    });

    const saved = await this.ratioRepo.save(ratio);
    this.logger.log(`Capital ratio calculated: ${calculationReference}, type=${ratioType}, ratio=${calculatedRatio.toFixed(4)}`);
    return saved;
  }

  /**
   * REG-BUFFER-001: Capital buffer requirements (CCyB, G-SIB buffers)
   */
  async calculateBufferRequirements(
    capitalRatio: CapitalRatio,
    ccybRate: number,
    gsibSurcharge?: number,
    dsibSurcharge?: number,
  ): Promise<{
    capitalConservationBuffer: number;
    ccybBuffer: number;
    gsibBuffer?: number;
    dsibBuffer?: number;
    totalBufferRequirement: number;
  }> {
    const conservationBuffer = capitalRatio.riskWeightedAssets * 0.025;
    const ccybBuffer = capitalRatio.riskWeightedAssets * ccybRate;
    const gsibBuffer = gsibSurcharge ? capitalRatio.riskWeightedAssets * gsibSurcharge : undefined;
    const dsibBuffer = dsibSurcharge ? capitalRatio.riskWeightedAssets * dsibSurcharge : undefined;

    const totalBufferRequirement = conservationBuffer + ccybBuffer + (gsibBuffer ?? 0) + (dsibBuffer ?? 0);

    return {
      capitalConservationBuffer: conservationBuffer,
      ccybBuffer,
      gsibBuffer,
      dsibBuffer,
      totalBufferRequirement,
    };
  }

  async findById(id: string): Promise<CapitalRatio> {
    const ratio = await this.ratioRepo.findOne({ where: { id } });
    if (!ratio) throw new NotFoundException('Capital ratio not found');
    return ratio;
  }

  async findAllByDateRange(startDate: Date, endDate: Date): Promise<CapitalRatio[]> {
    return this.ratioRepo.find({
      where: { reportingDate: Between(startDate, endDate) },
      order: { reportingDate: 'DESC', ratioType: 'ASC' },
    });
  }

  async getLatestRatios(): Promise<CapitalRatio[]> {
    const allRatios = await this.ratioRepo.find({
      order: { reportingDate: 'DESC', ratioType: 'ASC' },
    });

    const latestByType = new Map<string, CapitalRatio>();
    for (const ratio of allRatios) {
      if (!latestByType.has(ratio.ratioType)) {
        latestByType.set(ratio.ratioType, ratio);
      }
    }

    return Array.from(latestByType.values());
  }

  async getAdequacyStatus(currentDate: Date): Promise<CapitalAdequacyStatus> {
    const latestRatios = await this.getLatestRatios();
    const cet1 = latestRatios.find(r => r.ratioType === CapitalRatioType.CET1);

    if (!cet1) return CapitalAdequacyStatus.MINIMUM_BREACH;

    return cet1.adequacyStatus;
  }

  private generateCalculationReference(ratioType: CapitalRatioType): string {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const seq = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `CAP-${ratioType}-${yyyymm}-${seq}`;
  }

  private getMinimumRequirement(ratioType: CapitalRatioType): number {
    switch (ratioType) {
      case CapitalRatioType.CET1:
        return 0.045;
      case CapitalRatioType.TIER1:
        return 0.06;
      case CapitalRatioType.TOTAL_CAPITAL:
        return 0.08;
      default:
        return 0.08;
    }
  }

  private calculateAdequacyStatus(
    calculatedRatio: number,
    minimumRequirement: number,
    bufferRequirement: number,
  ): CapitalAdequacyStatus {
    const totalRequired = minimumRequirement + bufferRequirement;

    if (calculatedRatio < minimumRequirement) {
      return CapitalAdequacyStatus.MINIMUM_BREACH;
    }
    if (calculatedRatio < totalRequired) {
      return CapitalAdequacyStatus.BUFFER_BREACH;
    }
    return CapitalAdequacyStatus.COMPLIANT;
  }
}
