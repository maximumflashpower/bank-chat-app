import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiquidityRatio } from '../entities/liquidity-ratio.entity';
import { LiquidityRatioType, StressScenarioSeverity } from '../entities/capital-liquidity-status.enum';

@Injectable()
export class LiquidityService {
  private readonly logger = new Logger(LiquidityService.name);

  constructor(
    @InjectRepository(LiquidityRatio)
    private readonly ratioRepo: Repository<LiquidityRatio>,
  ) {}

  /**
   * REG-LCR-001: Liquidity Coverage Ratio daily calculation
   */
  async calculateLCR(
    hqlaAmount: number,
    totalNetCashOutflows30d: number,
    reportingDate: Date,
    calculatedByUserId: string,
    hqlaComposition?: {
      level: string;
      assetType: string;
      amount: number;
      haircutsApplied: number;
      adjustedAmount: number;
    }[],
    inflowsBreakdown?: {
      category: string;
      amount: number;
      haircutsApplied: number;
      netInflow: number;
    }[],
    outflowsBreakdown?: {
      category: string;
      amount: number;
      stressFactor: number;
      stressedOutflow: number;
    }[],
  ): Promise<LiquidityRatio> {
    const calculationReference = this.generateCalculationReference(LiquidityRatioType.LCR);
    const denominator = totalNetCashOutflows30d > 0 ? totalNetCashOutflows30d : 1;
    const calculatedRatio = hqlaAmount / denominator;
    const minimumRequirement = 1.0; // 100%
    const surplusAmount = calculatedRatio - minimumRequirement;

    const ratio = this.ratioRepo.create({
      calculationReference,
      reportingDate,
      ratioType: LiquidityRatioType.LCR,
      numeratorAmount: hqlaAmount,
      denominatorAmount: totalNetCashOutflows30d,
      calculatedRatio,
      minimumRequirement,
      surplusAmount,
      hqlaComposition,
      inflowsBreakdown,
      outflowsBreakdown,
      isStressTestResult: false,
      calculatedByUserId,
    });

    const saved = await this.ratioRepo.save(ratio);
    this.logger.log(`LCR calculated: ${calculationReference}, ratio=${calculatedRatio.toFixed(4)}`);
    return saved;
  }

  /**
   * REG-NSFR-001: Net Stable Funding Ratio quarterly calculation
   */
  async calculateNSFR(
    availableStableFunding: number,
    requiredStableFunding: number,
    reportingDate: Date,
    calculatedByUserId: string,
  ): Promise<LiquidityRatio> {
    const calculationReference = this.generateCalculationReference(LiquidityRatioType.NSFR);
    const denominator = requiredStableFunding > 0 ? requiredStableFunding : 1;
    const calculatedRatio = availableStableFunding / denominator;
    const minimumRequirement = 1.0; // 100%
    const surplusAmount = calculatedRatio - minimumRequirement;

    const ratio = this.ratioRepo.create({
      calculationReference,
      reportingDate,
      ratioType: LiquidityRatioType.NSFR,
      numeratorAmount: availableStableFunding,
      denominatorAmount: requiredStableFunding,
      calculatedRatio,
      minimumRequirement,
      surplusAmount,
      isStressTestResult: false,
      calculatedByUserId,
    });

    const saved = await this.ratioRepo.save(ratio);
    this.logger.log(`NSFR calculated: ${calculationReference}, ratio=${calculatedRatio.toFixed(4)}`);
    return saved;
  }

  /**
   * REG-LVR-001: Leverage Ratio monitoring
   */
  async calculateLeverageRatio(
    tier1Capital: number,
    totalExposure: number,
    reportingDate: Date,
    calculatedByUserId: string,
  ): Promise<LiquidityRatio> {
    const calculationReference = this.generateCalculationReference(LiquidityRatioType.LDR);
    const denominator = totalExposure > 0 ? totalExposure : 1;
    const calculatedRatio = tier1Capital / denominator;
    const minimumRequirement = 0.03; // 3%
    const surplusAmount = calculatedRatio - minimumRequirement;

    const ratio = this.ratioRepo.create({
      calculationReference,
      reportingDate,
      ratioType: LiquidityRatioType.LDR,
      numeratorAmount: tier1Capital,
      denominatorAmount: totalExposure,
      calculatedRatio,
      minimumRequirement,
      surplusAmount,
      isStressTestResult: false,
      calculatedByUserId,
    });

    const saved = await this.ratioRepo.save(ratio);
    this.logger.log(`Leverage ratio calculated: ${calculationReference}, ratio=${calculatedRatio.toFixed(4)}`);
    return saved;
  }

  /**
   * REG-STRESS-CAP-001: Stress testing capital adequacy
   */
  async calculateStressedLCR(
    baseHqlaAmount: number,
    baseNetOutflows: number,
    severity: StressScenarioSeverity,
    reportingDate: Date,
    calculatedByUserId: string,
  ): Promise<LiquidityRatio> {
    const stressFactors = this.getStressFactors(severity);
    const stressedHqla = baseHqlaAmount * stressFactors.hqlaHaircut;
    const stressedOutflows = baseNetOutflows * stressFactors.outflowStress;

    const calculationReference = this.generateCalculationReference(LiquidityRatioType.LCR);
    const denominator = stressedOutflows > 0 ? stressedOutflows : 1;
    const calculatedRatio = stressedHqla / denominator;
    const minimumRequirement = 1.0;
    const surplusAmount = calculatedRatio - minimumRequirement;

    const ratio = this.ratioRepo.create({
      calculationReference,
      reportingDate,
      ratioType: LiquidityRatioType.LCR,
      numeratorAmount: stressedHqla,
      denominatorAmount: stressedOutflows,
      calculatedRatio,
      minimumRequirement,
      surplusAmount,
      stressScenario: severity,
      isStressTestResult: true,
      calculatedByUserId,
    });

    const saved = await this.ratioRepo.save(ratio);
    this.logger.log(`Stressed LCR calculated (${severity}): ${calculationReference}, ratio=${calculatedRatio.toFixed(4)}`);
    return saved;
  }

  async findById(id: string): Promise<LiquidityRatio> {
    const ratio = await this.ratioRepo.findOne({ where: { id } });
    if (!ratio) throw new NotFoundException('Liquidity ratio not found');
    return ratio;
  }

  async findAllByDateRange(startDate: Date, endDate: Date): Promise<LiquidityRatio[]> {
    return this.ratioRepo.find({
      where: { reportingDate: Between(startDate, endDate) } as any,
      order: { reportingDate: 'DESC', ratioType: 'ASC' },
    });
  }

  async getLatestRatios(): Promise<LiquidityRatio[]> {
    const allRatios = await this.ratioRepo.find({
      order: { reportingDate: 'DESC', ratioType: 'ASC' },
    });

    const latestByType = new Map<string, LiquidityRatio>();
    for (const ratio of allRatios) {
      if (!latestByType.has(ratio.ratioType)) {
        latestByType.set(ratio.ratioType, ratio);
      }
    }

    return Array.from(latestByType.values());
  }

  private generateCalculationReference(ratioType: LiquidityRatioType): string {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const seq = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `LIQ-${ratioType}-${yyyymm}-${seq}`;
  }

  private getStressFactors(severity: StressScenarioSeverity): {
    hqlaHaircut: number;
    outflowStress: number;
  } {
    switch (severity) {
      case StressScenarioSeverity.BASE:
        return { hqlaHaircut: 1.0, outflowStress: 1.0 };
      case StressScenarioSeverity.ADVERSE:
        return { hqlaHaircut: 0.85, outflowStress: 1.25 };
      case StressScenarioSeverity.SEVERELY_ADVERSE:
        return { hqlaHaircut: 0.70, outflowStress: 1.50 };
      default:
        return { hqlaHaircut: 1.0, outflowStress: 1.0 };
    }
  }
}

// TypeORM helper
function Between(start: Date, end: Date) {
  return start;
}
