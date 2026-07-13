import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaselReport } from '../entities/basel-report.entity';
import { GenerateBaselReportDto } from '../dto/generate-basel-report.dto';
import { BaselReportType } from '../entities/basel-report-type.enum';

@Injectable()
export class BaselReportingService {
  private readonly logger = new Logger(BaselReportingService.name);

  constructor(
    @InjectRepository(BaselReport)
    private readonly reportRepo: Repository<BaselReport>,
  ) {}

  /**
   * REG-BASEL-001: Capital Adequacy Ratio report
   */
  async generateCapitalAdequacyReport(dto: GenerateBaselReportDto): Promise<BaselReport> {
    const ratio = dto.riskWeightedAssets > 0
      ? (dto.capitalAmount / dto.riskWeightedAssets) * 100
      : 0;

    const report = Object.assign(new BaselReport(), {
      reportType: BaselReportType.CAPITAL_ADEQUACY,
      capitalAmount: dto.capitalAmount,
      riskWeightedAssets: dto.riskWeightedAssets,
      capitalRatio: Math.round(ratio * 10000) / 10000,
      period: `Q${dto.quarter}/${dto.year}`,
      quarter: dto.quarter,
      year: dto.year,
      status: 'draft',
      notes: dto.notes || null,
    });

    const saved = await this.reportRepo.save(report) as unknown as BaselReport;
    this.logger.log(`Basel CAR report generated: ${saved.period} - ratio: ${ratio.toFixed(2)}%`);
    return saved;
  }

  /**
   * REG-BASEL-002: Liquidity Coverage Ratio (LCR)
   */
  async generateLcrReport(highQualityLiquidAssets: number, netCashOutflows: number, quarter: number, year: number): Promise<BaselReport> {
    const lcr = netCashOutflows > 0
      ? (highQualityLiquidAssets / netCashOutflows) * 100
      : 0;

    const report = Object.assign(new BaselReport(), {
      reportType: BaselReportType.LCR,
      capitalAmount: highQualityLiquidAssets,
      riskWeightedAssets: netCashOutflows,
      capitalRatio: Math.round(lcr * 10000) / 10000,
      period: `Q${quarter}/${year}`,
      quarter,
      year,
      status: 'draft',
      notes: 'Liquidity Coverage Ratio',
    });

    const saved = await this.reportRepo.save(report) as unknown as BaselReport;
    this.logger.log(`Basel LCR report generated: ${saved.period} - LCR: ${lcr.toFixed(2)}%`);
    return saved;
  }

  /**
   * REG-BASEL-003: Net Stable Funding Ratio (NSFR)
   */
  async generateNsfrReport(availableStableFunding: number, requiredStableFunding: number, quarter: number, year: number): Promise<BaselReport> {
    const nsfr = requiredStableFunding > 0
      ? (availableStableFunding / requiredStableFunding) * 100
      : 0;

    const report = Object.assign(new BaselReport(), {
      reportType: BaselReportType.NSFR,
      capitalAmount: availableStableFunding,
      riskWeightedAssets: requiredStableFunding,
      capitalRatio: Math.round(nsfr * 10000) / 10000,
      period: `Q${quarter}/${year}`,
      quarter,
      year,
      status: 'draft',
      notes: 'Net Stable Funding Ratio',
    });

    const saved = await this.reportRepo.save(report) as unknown as BaselReport;
    this.logger.log(`Basel NSFR report generated: ${saved.period} - NSFR: ${nsfr.toFixed(2)}%`);
    return saved;
  }

  /**
   * REG-BASEL-004: Leverage Ratio monitoring
   */
  async generateLeverageReport(tier1Capital: number, totalExposure: number, quarter: number, year: number): Promise<BaselReport> {
    const leverage = totalExposure > 0
      ? (tier1Capital / totalExposure) * 100
      : 0;

    const report = Object.assign(new BaselReport(), {
      reportType: BaselReportType.LEVERAGE,
      capitalAmount: tier1Capital,
      riskWeightedAssets: totalExposure,
      capitalRatio: Math.round(leverage * 10000) / 10000,
      period: `Q${quarter}/${year}`,
      quarter,
      year,
      status: 'draft',
      notes: 'Leverage Ratio',
    });

    const saved = await this.reportRepo.save(report) as unknown as BaselReport;
    this.logger.log(`Basel Leverage report generated: ${saved.period} - ratio: ${leverage.toFixed(2)}%`);
    return saved;
  }

  /**
   * List all Basel reports
   */
  async findAll(reportType?: string, year?: number): Promise<BaselReport[]> {
    const where: any = {};
    if (reportType) where.reportType = reportType;
    if (year) where.year = year;

    return this.reportRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  /**
   * Get single report
   */
  async findById(id: string): Promise<BaselReport | null> {
    return this.reportRepo.findOne({ where: { id } });
  }
}
