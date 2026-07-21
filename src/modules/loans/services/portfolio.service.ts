import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { LoanMaster } from '../entities/loan-master.entity';
import { LoanType, LoanStatus } from '../entities/loans.enums';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(LoanMaster)
    private repo: Repository<LoanMaster>,
  ) {}

  async getPortfolioSummary(): Promise<{
    totalLoans: number;
    totalOutstanding: number;
    averageInterestRate: number;
    delinquencyRate: number;
  }> {
    const loans = await this.repo.find();
    const totalLoans = loans.length;
    const totalOutstanding = loans.reduce((sum, l) => sum + (l.currentPrincipalBalance || 0), 0);
    const averageInterestRate = loans.length > 0 
      ? loans.reduce((sum, l) => sum + l.interestRate, 0) / loans.length 
      : 0;
    const delinquentLoans = loans.filter(l => ['defaulted', 'charged_off'].includes(l.status)).length;
    const delinquencyRate = totalLoans > 0 ? (delinquentLoans / totalLoans) * 100 : 0;
    
    return { totalLoans, totalOutstanding, averageInterestRate, delinquencyRate };
  }

  async getPortfolioBySegment(segment: string): Promise<any[]> {
    // Stub: filter by loan type
    return this.repo.find({ where: {} as FindOptionsWhere<LoanMaster> });
  }

  async getAssetQualityReport(): Promise<{
    performing: number;
    nonPerforming: number;
    criticized: number;
    netChargeOffRate: number;
  }> {
    const loans = await this.repo.find();
    const performing = loans.filter(l => l.status === 'active').length;
    const nonPerforming = loans.filter(l => ['defaulted', 'charged_off'].includes(l.status)).length;
    const criticized = loans.filter(l => ['defaulted'].includes(l.status)).length;
    const netChargeOffRate = loans.length > 0 ? (nonPerforming / loans.length) * 100 : 0;
    
    return { performing, nonPerforming, criticized, netChargeOffRate };
  }

  async calculateRwacRiskWeightedAssets(): Promise<{ rwac: number; capitalRequired: number }> {
    const loans = await this.repo.find();
    // Simplified RWAC calculation
    let totalRWA = 0;
    for (const loan of loans) {
      const riskWeight = this.getRiskWeight(loan);
      totalRWA += (loan.principalAmount || 0) * riskWeight;
    }
    const rwac = totalRWA / loans.length;
    const capitalRequired = totalRWA * 0.08; // 8% capital requirement
    
    return { rwac, capitalRequired };
  }

  async stressTestScenarios(scenario: string): Promise<{ impactedLoans: number; estimatedLoss: number }> {
    const loans = await this.repo.find();
    let impactedCount = 0;
    let estimatedLoss = 0;
    
    for (const loan of loans) {
      let probabilityDefault = 0;
      switch (scenario) {
        case 'baseline': probabilityDefault = 0.02; break;
        case 'moderate': probabilityDefault = 0.05; break;
        case 'severe': probabilityDefault = 0.10; break;
      }
      
      if (Math.random() < probabilityDefault) {
        impactedCount++;
        estimatedLoss += loan.principalAmount * 0.45; // 45% LGD assumption
      }
    }
    
    return { impactedLoans: impactedCount, estimatedLoss };
  }

  async calculateAllowanceForLoanLosses(): Promise<number> {
    const loans = await this.repo.find();
    let allowance = 0;
    
    for (const loan of loans) {
      let pd = 0.02; // Probability of default
      let lgd = 0.45; // Loss given default
      
      switch (loan.status) {
        case 'defaulted': pd = 0.80; lgd = 0.75; break;
        case 'charged_off': pd = 1.00; lgd = 1.00; break;
        case 'active': pd = 0.02; lgd = 0.45; break;
      }
      
      allowance += (loan.principalAmount || 0) * pd * lgd;
    }
    
    return allowance;
  }

  async getPortfolioConcentration(limitType: string): Promise<{ concentration: number; limitBreached: boolean }> {
    const loans = await this.repo.find();
    const totalExposure = loans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
    
    // Single borrower concentration limit (25%)
    let maxSingleBorrower = 0;
    const borrowerMap = new Map<string, number>();
    
    for (const loan of loans) {
      const borrower = loan.customerId || 'unknown';
      const current = borrowerMap.get(borrower) || 0;
      borrowerMap.set(borrower, current + (loan.principalAmount || 0));
      maxSingleBorrower = Math.max(maxSingleBorrower, current + (loan.principalAmount || 0));
    }
    
    const concentration = totalExposure > 0 ? (maxSingleBorrower / totalExposure) * 100 : 0;
    return { concentration, limitBreached: concentration > 25 };
  }

  async generateRegulatoryReport(reportType: string, period: string): Promise<any> {
    const summary = await this.getPortfolioSummary();
    const quality = await this.getAssetQualityReport();
    
    return {
      reportType,
      period,
      generatedAt: new Date(),
      summary,
      assetQuality: quality,
    };
  }

  async trackNetChargeOffs(period: string): Promise<{ chargeOffs: number; recoveries: number; netChargeOff: number }> {
    const loans = await this.repo.find();
    const chargeOffs = loans.filter(l => l.status === 'charged_off').reduce((sum, l) => sum + (l.currentPrincipalBalance || 0), 0);
    const recoveries = chargeOffs * 0.2; // 20% recovery rate assumption
    const netChargeOff = chargeOffs - recoveries;
    
    return { chargeOffs, recoveries, netChargeOff };
  }

  async rebalancePortfolio(targetAllocation: Record<string, number>): Promise<{ recommendedActions: any[] }> {
    const current = await this.getPortfolioSummary();
    const actions: any[] = [];
    
    for (const [segment, target] of Object.entries(targetAllocation)) {
      // Stub: would recommend purchases/sales
      actions.push({ segment, targetAllocation: target, action: 'review' });
    }
    
    return { recommendedActions: actions };
  }

  private getRiskWeight(loan: LoanMaster): number {
    switch (loan.loanType) {
      case 'mortgage': return 0.35;
      case 'auto': return 0.75;
      case 'personal': return 1.00;
      case 'commercial': return 1.00;
      default: return 0.75;
    }
  }
}
