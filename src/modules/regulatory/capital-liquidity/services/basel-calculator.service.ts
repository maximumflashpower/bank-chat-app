import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CapitalRatio } from '../entities/capital-ratio.entity';
import { LiquidityRatio } from '../entities/liquidity-ratio.entity';
import { CapitalRatioType, BufferType, ICAAPStatus, Pillar3Frequency, StressScenarioSeverity } from '../entities/capital-liquidity-status.enum';

@Injectable()
export class BaselCalculatorService {
  private readonly logger = new Logger(BaselCalculatorService.name);

  constructor(
    @InjectRepository(CapitalRatio)
    private readonly capitalRatioRepo: Repository<CapitalRatio>,
    @InjectRepository(LiquidityRatio)
    private readonly liquidityRatioRepo: Repository<LiquidityRatio>,
  ) {}

  /**
   * REG-ICAAP-001: ICAAP internal capital adequacy assessment process
   */
  async performICAAP(
    cet1Ratio: number,
    tier1Ratio: number,
    totalCapitalRatio: number,
    leverageRatio: number,
    projectedRWA_growth: number,
    assessedByUserId: string,
  ): Promise<{
    assessmentId: string;
    overallStatus: ICAAPStatus;
    capitalSurplus: number;
    projectedShortfall: number;
    recommendation: string;
    assessedAt: Date;
  }> {
    const assessmentId = `ICAAP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const minCET1 = 0.045;
    const minTier1 = 0.06;
    const minTotal = 0.08;
    const minLeverage = 0.03;

    const allMetricsMet =
      cet1Ratio >= minCET1 &&
      tier1Ratio >= minTier1 &&
      totalCapitalRatio >= minTotal &&
      leverageRatio >= minLeverage;

    const projectedRWA = 1 + projectedRWA_growth;
    const projectedCET1 = cet1Ratio / projectedRWA;
    const projectedShortfall = projectedCET1 < minCET1 ? (minCET1 - projectedCET1) : 0;

    const overallStatus = allMetricsMet && projectedShortfall === 0
      ? ICAAPStatus.APPROVED
      : ICAAPStatus.IN_REVIEW;

    const recommendation = projectedShortfall > 0
      ? `Capital shortfall projected: ${(projectedShortfall * 100).toFixed(2)}%. Recommend capital raising or RWA optimization.`
      : 'Capital adequacy maintained under projected growth scenarios.';

    this.logger.log(`ICAAP assessment ${assessmentId}: status=${overallStatus}, shortfall=${projectedShortfall.toFixed(4)}`);

    return {
      assessmentId,
      overallStatus,
      capitalSurplus: cet1Ratio - minCET1,
      projectedShortfall,
      recommendation,
      assessedAt: new Date(),
    };
  }

  /**
   * REG-PILLAR3-001: Pillar 3 disclosure reports
   */
  async generatePillar3Report(
    reportingDate: Date,
    frequency: Pillar3Frequency,
    generatedByUserId: string,
  ): Promise<{
    reportReference: string;
    reportingDate: Date;
    frequency: Pillar3Frequency;
    sections: {
      sectionName: string;
      sectionData: Record<string, unknown>;
    }[];
    generatedAt: Date;
    generatedBy: string;
  }> {
    const reportReference = `P3-${reportingDate.getFullYear()}-${frequency.toUpperCase()}`;

    const sections: { sectionName: string; sectionData: Record<string, unknown> }[] = [];

    // KM1: Summary of capital ratios
    const latestCapitalRatios = await this.getLatestCapitalRatios();
    sections.push({
      sectionName: 'KM1 - Summary of Capital Ratios',
      sectionData: {
        cet1Ratio: latestCapitalRatios.find(r => r.ratioType === CapitalRatioType.CET1)?.calculatedRatio ?? 0,
        tier1Ratio: latestCapitalRatios.find(r => r.ratioType === CapitalRatioType.TIER1)?.calculatedRatio ?? 0,
        totalCapitalRatio: latestCapitalRatios.find(r => r.ratioType === CapitalRatioType.TOTAL_CAPITAL)?.calculatedRatio ?? 0,
        leverageRatio: latestCapitalRatios.find(r => r.ratioType === CapitalRatioType.LEVERAGE)?.calculatedRatio ?? 0,
      },
    });

    // LCR Disclosure
    const latestLiquidityRatios = await this.getLatestLiquidityRatios();
    sections.push({
      sectionName: 'LIQ1 - LCR Disclosure',
      sectionData: {
        lcrRatio: latestLiquidityRatios.find(r => r.ratioType === 'LCR')?.calculatedRatio ?? 0,
        nsfrRatio: latestLiquidityRatios.find(r => r.ratioType === 'NSFR')?.calculatedRatio ?? 0,
        hqlaComposition: latestLiquidityRatios.find(r => r.ratioType === 'LCR')?.hqlaComposition ?? [],
      },
    });

    // Buffer Requirements
    const cet1Ratio = latestCapitalRatios.find(r => r.ratioType === CapitalRatioType.CET1);
    if (cet1Ratio?.bufferBreakdown) {
      sections.push({
        sectionName: 'CC1 - Capital Buffers',
        sectionData: {
          bufferBreakdown: cet1Ratio.bufferBreakdown,
          totalBufferRequirement: cet1Ratio.bufferRequirement,
        },
      });
    }

    this.logger.log(`Pillar 3 report generated: ${reportReference}`);

    return {
      reportReference,
      reportingDate,
      frequency,
      sections,
      generatedAt: new Date(),
      generatedBy: generatedByUserId,
    };
  }

  /**
   * Calculate risk-weighted assets using standardized approach
   */
  async calculateRWA(
    exposures: {
      exposureCategory: string;
      exposureAmount: number;
      riskWeight: number;
    }[],
  ): Promise<{
    totalRWA: number;
    breakdown: { exposureCategory: string; exposureAmount: number; riskWeight: number; rwa: number }[];
  }> {
    const breakdown = exposures.map(e => ({
      exposureCategory: e.exposureCategory,
      exposureAmount: e.exposureAmount,
      riskWeight: e.riskWeight,
      rwa: e.exposureAmount * e.riskWeight,
    }));

    const totalRWA = breakdown.reduce((sum, b) => sum + b.rwa, 0);

    this.logger.log(`RWA calculated: total=${totalRWA.toFixed(2)}, categories=${breakdown.length}`);

    return { totalRWA, breakdown };
  }

  private async getLatestCapitalRatios(): Promise<CapitalRatio[]> {
    const all = await this.capitalRatioRepo.find({
      order: { reportingDate: 'DESC', ratioType: 'ASC' },
    });

    const latestByType = new Map<string, CapitalRatio>();
    for (const ratio of all) {
      if (!latestByType.has(ratio.ratioType)) {
        latestByType.set(ratio.ratioType, ratio);
      }
    }

    return Array.from(latestByType.values());
  }

  private async getLatestLiquidityRatios(): Promise<LiquidityRatio[]> {
    const all = await this.liquidityRatioRepo.find({
      order: { reportingDate: 'DESC', ratioType: 'ASC' },
    });

    const latestByType = new Map<string, LiquidityRatio>();
    for (const ratio of all) {
      if (!latestByType.has(ratio.ratioType)) {
        latestByType.set(ratio.ratioType, ratio);
      }
    }

    return Array.from(latestByType.values());
  }
}
