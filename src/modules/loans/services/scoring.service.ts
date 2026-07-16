// src/modules/loans/services/scoring.service.ts

import { Injectable } from '@nestjs/common';

interface ScoringInputs {
  bureauScore?: number;
  dtiRatio?: number;
  annualIncome?: number;
  employmentTenureYears?: number;
  creditUtilization?: number;
  paymentHistoryPercent?: number;
  numberOfInquiries?: number;
  accountAgeMonths?: number;
  loanAmountRequested?: number;
}

@Injectable()
export class ScoringService {
  calculateInternalScore(inputs: ScoringInputs): { score: number, rating: string, pd: number, lgd: number, el: number } {
    let score = 500;
    
    if (inputs.bureauScore) {
      score += (inputs.bureauScore - 500) * 0.5;
    }
    
    if (inputs.dtiRatio !== undefined) {
      if (inputs.dtiRatio < 20) score += 50;
      else if (inputs.dtiRatio < 36) score += 30;
      else if (inputs.dtiRatio < 43) score += 10;
      else score -= 20;
    }
    
    if (inputs.employmentTenureYears) {
      score += Math.min(inputs.employmentTenureYears * 5, 30);
    }
    
    if (inputs.paymentHistoryPercent) {
      score += (inputs.paymentHistoryPercent - 80) * 1;
    }
    
    if (inputs.creditUtilization !== undefined) {
      if (inputs.creditUtilization < 30) score += 20;
      else if (inputs.creditUtilization < 50) score += 10;
      else score -= 15;
    }
    
    score = Math.max(300, Math.min(850, Math.round(score)));
    
    const rating = this.calculateRating(score);
    const pd = this.calculatePd(score);
    const lgd = 0.45;
    const el = pd * lgd * (inputs.loanAmountRequested || 0);
    
    return { score, rating, pd, lgd, el };
  }

  private calculateRating(score: number): string {
    if (score >= 750) return 'AAA';
    if (score >= 700) return 'AA';
    if (score >= 650) return 'A';
    if (score >= 600) return 'BBB';
    if (score >= 550) return 'BB';
    if (score >= 500) return 'B';
    if (score >= 450) return 'CCC';
    return 'D';
  }

  private calculatePd(score: number): number {
    return 0.05 * Math.exp(-0.01 * (score - 500));
  }

  evaluateDecision(pd: number, lgd: number, el: number, policyThreshold: { maxPd: number, maxEl: number }): 'approve' | 'deny' | 'conditional' {
    if (pd > policyThreshold.maxPd || el > policyThreshold.maxEl) return 'deny';
    if (pd > policyThreshold.maxPd * 0.7) return 'conditional';
    return 'approve';
  }
}
