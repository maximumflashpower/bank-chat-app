import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegulatoryStressTest } from '../entities/regulatory-stress-test.entity';
import { StressTestStatus } from '../entities/stress-test-status.enum';
import { CreateScenarioDto, RunStressTestDto, ReviewStressTestDto } from '../dto/create-scenario.dto';

@Injectable()
export class StressTestService {
  constructor(
    @InjectRepository(RegulatoryStressTest)
    private readonly repo: Repository<RegulatoryStressTest>,
  ) {}

  // REG-STRESS-001: Create stress test scenario
  async createScenario(dto: CreateScenarioDto): Promise<RegulatoryStressTest> {
    const reference = `ST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;
    const scenario = this.repo.create({
      stressTestReference: reference,
      scenarioName: dto.scenarioName,
      scenarioType: dto.scenarioType,
      reportingCycle: dto.reportingCycle,
      macroAssumptionsJson: dto.macroAssumptions || {},
      minimumCapitalThreshold: dto.minimumCapitalThreshold || 4.5,
      modelVersioningJson: dto.modelVersioning || {},
      narrativeExplanation: dto.narrative || null,
      status: StressTestStatus.CONFIGURED,
    });
    return this.repo.save(scenario);
  }

  // REG-STRESS-002 + 003 + 004 + 005 + 006: Run stress test with macro shocks
  async runStressTest(dto: RunStressTestDto): Promise<RegulatoryStressTest> {
    const test = await this.repo.findOne({ where: { id: dto.stressTestId } });
    if (!test) throw new NotFoundException('Stress test not found');
    if (test.status !== StressTestStatus.CONFIGURED && test.status !== StressTestStatus.COMPLETED) {
      throw new BadRequestException(`Cannot run test in status ${test.status}`);
    }

    test.status = StressTestStatus.RUNNING;
    await this.repo.save(test);

    // REG-STRESS-002: Apply macroeconomic shocks
    const shocks = dto.macroShocks || {
      gdp: -3.5,
      unemployment: 8.0,
      hpi: -15.0,
      rates: +200,
      inflation: 4.0,
    };

    // REG-STRESS-003: Project PPNR
    const ppnr = this.projectPPNR(shocks);

    // REG-STRESS-004: Project credit losses (PD x LGD x EAD simplified)
    const creditLosses = this.projectCreditLosses(shocks);

    // Trading and operational losses
    const tradingLosses = Math.abs(shocks.rates || 0) * 50000;
    const operationalLosses = (shocks.gdp || 0 < -2) ? 500000 : 250000;

    // REG-STRESS-005: Capital ratio projection
    const cet1Ratio = Math.max(0, 12.0 - (creditLosses / 1_000_000_000) * 100);
    const tier1Ratio = cet1Ratio + 1.5;
    const totalRatio = tier1Ratio + 2.0;
    const rwa = 10_000_000_000 * (1 + Math.abs(shocks.gdp || 0) / 10);

    const breach = cet1Ratio < test.minimumCapitalThreshold;

    // REG-STRESS-006: Liquidity ratio under stress
    const lcrStressed = Math.max(0, 110 - Math.abs(shocks.gdp || 0) * 5);
    const nsfrStressed = Math.max(0, 105 - Math.abs(shocks.gdp || 0) * 3);

    test.macroAssumptionsJson = { ...test.macroAssumptionsJson, ...shocks };
    test.preProvisionNetRevenueProjected = ppnr;
    test.creditLossesProjected = creditLosses;
    test.tradingLossesProjected = tradingLosses;
    test.operationalLossesProjected = operationalLosses;
    test.capitalRatiosProjectedJson = {
      cet1: cet1Ratio.toFixed(2),
      tier1: tier1Ratio.toFixed(2),
      total: totalRatio.toFixed(2),
      rwa: rwa.toFixed(0),
    };
    test.breachUnderStress = breach;
    test.liquidityRatioStressed = lcrStressed;
    test.nsfrStressed = nsfrStressed;
    test.creditLossModelVersion = dto.creditLossModelVersion || 'v2.1-base';
    test.status = StressTestStatus.COMPLETED;
    test.executedAt = new Date();

    return this.repo.save(test);
  }

  // REG-STRESS-007: Reverse stress testing
  async reverseStressTest(stressTestId: string): Promise<RegulatoryStressTest> {
    const test = await this.repo.findOne({ where: { id: stressTestId } });
    if (!test) throw new NotFoundException('Stress test not found');

    // Find break-point scenario where capital fails
    let gdpShock = -1.0;
    let breakPoint = null;
    while (gdpShock >= -30) {
      const projectedCet1 = 12.0 - Math.abs(gdpShock) * 0.8;
      if (projectedCet1 < test.minimumCapitalThreshold) {
        breakPoint = { gdpBreakPoint: gdpShock, cet1AtBreak: projectedCet1.toFixed(2) };
        break;
      }
      gdpShock -= 0.5;
    }

    test.narrativeExplanation = `Reverse stress test: capital breaks at GDP shock ${(breakPoint as any)?.gdpBreakPoint}%. CET1 at break-point: ${(breakPoint as any)?.cet1AtBreak}%.`;
    test.status = StressTestStatus.REVIEWED;
    return this.repo.save(test);
  }

  async reviewResults(dto: ReviewStressTestDto): Promise<RegulatoryStressTest> {
    const test = await this.repo.findOne({ where: { id: dto.stressTestId } });
    if (!test) throw new NotFoundException('Stress test not found');
    if (test.status !== StressTestStatus.COMPLETED) {
      throw new BadRequestException('Stress test must be completed before review');
    }
    if (dto.narrativeExplanation) {
      test.narrativeExplanation = dto.narrativeExplanation;
    }
    test.status = StressTestStatus.REVIEWED;
    return this.repo.save(test);
  }

  async submitToRegulator(stressTestId: string): Promise<RegulatoryStressTest> {
    const test = await this.repo.findOne({ where: { id: stressTestId } });
    if (!test) throw new NotFoundException('Stress test not found');
    if (test.status !== StressTestStatus.REVIEWED) {
      throw new BadRequestException('Stress test must be reviewed before submission');
    }
    test.submittedToRegulator = true;
    test.submissionDate = new Date();
    test.status = StressTestStatus.SUBMITTED;
    return this.repo.save(test);
  }

  async getScenarios(): Promise<RegulatoryStressTest[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async getById(id: string): Promise<RegulatoryStressTest> {
    const test = await this.repo.findOne({ where: { id } });
    if (!test) throw new NotFoundException('Stress test not found');
    return test;
  }

  private projectPPNR(shocks: Record<string, number>): number {
    const gdpImpact = (shocks.gdp || 0) * -500_000;
    const ratesImpact = (shocks.rates || 0) * 25_000;
    return 5_000_000 + gdpImpact + ratesImpact;
  }

  private projectCreditLosses(shocks: Record<string, number>): number {
    const pdBase = 0.02;
    const lgdBase = 0.45;
    const eadBase = 8_000_000_000;
    const pdStressed = pdBase + Math.abs(shocks.unemployment || 0) / 1000;
    const lgdStressed = lgdBase + Math.abs(shocks.hpi || 0) / 200;
    return pdStressed * lgdStressed * eadBase;
  }
}
