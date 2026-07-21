import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditScore, ScoreGrade, RiskBand } from '../entities/credit-score.entity';
import { CalculateCreditScoreDto } from '../dto/create-credit-score.dto';

interface LoanDecision {
  decision: 'approve' | 'reject' | 'conditional';
  conditions?: string[];
  maxAmount?: number;
  suggestedRate?: number;
}

@Injectable()
export class CreditScoringService {
  constructor(
    @InjectRepository(CreditScore)
    private readonly creditScoreRepo: Repository<CreditScore>,
  ) {}

  async calculateAndSaveScore(dto: CalculateCreditScoreDto): Promise<CreditScore> {
    const bureauScore = dto.bureauScore || this.estimateBureauScore(dto);
    const internalScore = this.calculateInternalScore(dto);
    const altDataScore = this.calculateAltDataScore(dto);

    const score = Math.round(
      bureauScore * 0.5 +
      internalScore * 0.35 +
      altDataScore * 0.15
    );

    const scoreGrade = this.calculateGrade(score);
    const riskBand = this.calculateRiskBand(score);

    const creditScore = this.creditScoreRepo.create({
      userId: dto.userId,
      score,
      scoreGrade,
      bureauScore,
      internalScore,
      altDataScore,
      riskBand,
      factors: this.analyzeFactors(dto),
      calculatedAt: new Date(),
    });

    return this.creditScoreRepo.save(creditScore);
  }

  calculateDtiRatio(monthlyDebtPayments: number, monthlyGrossIncome: number): number {
    if (monthlyGrossIncome <= 0) return 100;
    return (monthlyDebtPayments / monthlyGrossIncome) * 100;
  }

  makeLoanDecision(
    creditScore: number,
    dtiRatio: number,
    loanToIncomeRatio: number,
  ): LoanDecision {
    const conditions: string[] = [];

    if (creditScore < 580) {
      return { decision: 'reject', conditions: ['Credit score below minimum threshold'] };
    }

    if (dtiRatio > 50) {
      return { decision: 'reject', conditions: ['Debt-to-income ratio too high'] };
    }

    if (loanToIncomeRatio > 5) {
      conditions.push('Loan amount exceeds recommended multiple of income');
    }

    let suggestedRate = 0.065;
    let maxAmount: number | undefined;

    if (creditScore >= 720) {
      suggestedRate = 0.065;
    } else if (creditScore >= 660) {
      suggestedRate = 0.085;
    } else if (creditScore >= 620) {
      suggestedRate = 0.115;
      maxAmount = 50000;
      conditions.push('Limited loan amount due to near-prime score');
    } else {
      suggestedRate = 0.145;
      maxAmount = 25000;
      conditions.push('Restricted loan amount due to subprime score');
    }

    if (dtiRatio > 43) {
      conditions.push('Require additional income verification');
      suggestedRate += 0.01;
    }

    if (conditions.length > 0) {
      return { decision: 'conditional', conditions, maxAmount, suggestedRate };
    }

    return { decision: 'approve', suggestedRate };
  }

  async findByUserId(userId: string, limit: number = 5): Promise<CreditScore[]> {
    return this.creditScoreRepo.find({
      where: { userId },
      order: { calculatedAt: 'DESC' },
      take: limit,
    });
  }

  async getLatestScore(userId: string): Promise<CreditScore | null> {
    return this.creditScoreRepo.findOne({
      where: { userId },
      order: { calculatedAt: 'DESC' },
    });
  }

  private estimateBureauScore(dto: CalculateCreditScoreDto): number {
    const baseScore = 650;
    let adjustment = 0;

    if (dto.annualIncome && dto.annualIncome > 75000) adjustment += 30;
    if (dto.employmentTenureYears && dto.employmentTenureYears > 5) adjustment += 20;
    if (dto.paymentHistoryPercent && dto.paymentHistoryPercent > 95) adjustment += 40;

    return Math.min(850, baseScore + adjustment);
  }

  private calculateInternalScore(dto: CalculateCreditScoreDto): number {
    let score = 650;

    if (dto.dtiRatio !== undefined) {
      if (dto.dtiRatio < 20) score += 50;
      else if (dto.dtiRatio < 36) score += 30;
      else if (dto.dtiRatio < 43) score += 10;
      else score -= 20;
    }

    if (dto.employmentTenureYears) {
      score += Math.min(dto.employmentTenureYears * 5, 30);
    }

    if (dto.paymentHistoryPercent) {
      score += (dto.paymentHistoryPercent - 80);
    }

    if (dto.creditUtilization !== undefined) {
      if (dto.creditUtilization < 30) score += 20;
      else if (dto.creditUtilization < 50) score += 10;
      else score -= 15;
    }

    if (dto.accountAgeMonths) {
      score += Math.min(Math.floor(dto.accountAgeMonths / 12) * 3, 15);
    }

    if (dto.numberOfInquiries && dto.numberOfInquiries > 5) {
      score -= Math.min((dto.numberOfInquiries - 5) * 5, 25);
    }

    return Math.max(300, Math.min(850, Math.round(score)));
  }

  private calculateAltDataScore(dto: CalculateCreditScoreDto): number {
    let score = 600;

    if (dto.annualIncome && dto.annualIncome > 50000) score += 40;
    if (dto.loanAmountRequested && dto.annualIncome) {
      const loanToIncome = dto.loanAmountRequested / dto.annualIncome;
      if (loanToIncome < 1) score += 30;
      else if (loanToIncome < 3) score += 10;
      else score -= 20;
    }

    return Math.max(300, Math.min(850, Math.round(score)));
  }

  private calculateGrade(score: number): ScoreGrade {
    if (score >= 750) return ScoreGrade.EXCELLENT;
    if (score >= 700) return ScoreGrade.GOOD;
    if (score >= 630) return ScoreGrade.FAIR;
    if (score >= 580) return ScoreGrade.POOR;
    return ScoreGrade.VERY_POOR;
  }

  private calculateRiskBand(score: number): RiskBand {
    if (score >= 720) return RiskBand.PRIME;
    if (score >= 660) return RiskBand.NEAR_PRIME;
    if (score >= 620) return RiskBand.SUBPRIME;
    return RiskBand.DEEP_SUBPRIME;
  }

  private analyzeFactors(dto: CalculateCreditScoreDto): Record<string, any> {
    const factors: Record<string, any> = {};

    if (dto.bureauScore) factors.bureau = { score: dto.bureauScore, weight: 0.5 };
    if (dto.dtiRatio !== undefined) factors.dti = { ratio: dto.dtiRatio, impact: dto.dtiRatio < 36 ? 'positive' : 'negative' };
    if (dto.paymentHistoryPercent) factors.paymentHistory = { percent: dto.paymentHistoryPercent };
    if (dto.creditUtilization !== undefined) factors.utilization = { percent: dto.creditUtilization };
    if (dto.employmentTenureYears) factors.employment = { tenureYears: dto.employmentTenureYears };

    return factors;
  }
}
