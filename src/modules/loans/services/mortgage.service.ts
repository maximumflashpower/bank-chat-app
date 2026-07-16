// src/modules/loans/services/mortgage.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';

export interface MortgageAppraisal {
  appraisalId: string;
  propertyAddress: string;
  assessedValue: number;
  appraisalDate: Date;
  appraiserName: string;
  reportUrl?: string;
}

export interface TitleSearchResult {
  searchId: string;
  propertyAddress: string;
  verificationStatus: 'clear' | 'pending' | 'has_liens';
  liens?: Array<{ type: string; amount: number; recordedDate: Date }>;
  searchDate: Date;
}

@Injectable()
export class MortgageService {
  private mockAppraisals: Map<string, MortgageAppraisal> = new Map();
  private mockTitleResults: Map<string, TitleSearchResult> = new Map();

  async orderAppraisal(applicationId: string, propertyAddress: string, propertyType?: string, estimatedValue?: number): Promise<MortgageAppraisal> {
    const appraisal: MortgageAppraisal = {
      appraisalId: `APPRL-${Date.now()}`,
      propertyAddress,
      assessedValue: estimatedValue || 300000,
      appraisalDate: new Date(),
      appraiserName: 'Certified Valuation Partners',
      reportUrl: `/reports/appraisal/${applicationId}.pdf`,
    };
    this.mockAppraisals.set(applicationId, appraisal);
    return appraisal;
  }

  async getAppraisalResult(applicationId: string): Promise<MortgageAppraisal> {
    const appraisal = this.mockAppraisals.get(applicationId);
    if (!appraisal) throw new NotFoundException(`Appraisal for ${applicationId} not found`);
    return appraisal;
  }

  async performTitleSearch(applicationId: string, propertyAddress: string): Promise<TitleSearchResult> {
    const result: TitleSearchResult = {
      searchId: `TITLE-${Date.now()}`,
      propertyAddress,
      verificationStatus: Math.random() > 0.1 ? 'clear' : 'has_liens',
      searchDate: new Date(),
    };
    if (result.verificationStatus === 'has_liens') {
      result.liens = [{ type: 'tax_lien', amount: 5000, recordedDate: new Date() }];
    }
    this.mockTitleResults.set(applicationId, result);
    return result;
  }

  getTitleSearchResult(applicationId: string): TitleSearchResult {
    const result = this.mockTitleResults.get(applicationId);
    if (!result) throw new NotFoundException(`Title search for ${applicationId} not found`);
    return result;
  }

  calculateLtv(appraisedValue: number, loanAmount: number): number {
    return (loanAmount / appraisedValue) * 100;
  }

  calculateDebtRatios(frontEndIncome: number, backEndIncome: number, grossIncome: number): { frontEnd: number; backEnd: number } {
    return {
      frontEnd: (frontEndIncome / grossIncome) * 100,
      backEnd: (backEndIncome / grossIncome) * 100,
    };
  }
}
